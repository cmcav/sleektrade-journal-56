
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get API keys from environment variables
    const apiLoginId = Deno.env.get("AUTHNET_API_LOGIN_ID");
    const transactionKey = Deno.env.get("AUTHNET_TRANSACTION_KEY");
    const environment = Deno.env.get("AUTHNET_ENVIRONMENT") || "SANDBOX";
    
    if (!apiLoginId || !transactionKey) {
      console.error("Missing Authorize.net credentials:", { 
        apiLoginId: !!apiLoginId, 
        transactionKey: !!transactionKey 
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Authorize.net configuration is missing" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }
    
    console.log("Using Authorize.net credentials:", { 
      apiLoginId, 
      environment,
      transactionKeyLength: transactionKey.length // Log length only, not the actual key
    });
    
    // Parse request body
    const { cardData, amount, planType, billingAddress, discountCode } = await req.json();
    
    // Check if amount is needed
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid amount provided" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    // Create Supabase client for checking discount code and recording subscription
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract the user ID from the JWT token in the request
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
        }
      } catch (error) {
        console.error("Error extracting user ID from token:", error);
      }
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "User authentication required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }
    
    // Verify discount code if provided
    let appliedDiscount = null;
    
    if (discountCode) {
      console.log("Checking discount code:", discountCode);
      
      const { data: discountData, error: discountError } = await supabase
        .from("discount_codes")
        .select("id, code, percentage, max_uses, uses_count, expires_at")
        .eq("code", discountCode)
        .eq("is_active", true)
        .single();
      
      if (!discountError && discountData) {
        // Validate discount code
        const isExpired = discountData.expires_at && new Date(discountData.expires_at) < new Date();
        const isMaxedOut = discountData.max_uses !== null && discountData.uses_count >= discountData.max_uses;
        
        if (!isExpired && !isMaxedOut) {
          // Apply discount
          appliedDiscount = {
            id: discountData.id,
            code: discountData.code,
            percentage: discountData.percentage
          };
          
          console.log(`Applied discount: ${discountData.percentage}%. Final amount: $${finalAmount}`);
        } else {
          console.log("Discount code invalid:", isExpired ? "expired" : "maxed out");
        }
      } else {
        console.log("Discount code not found or error:", discountError);
      }
    }
    
    // If the final amount is 0, we can skip payment processing
    if (finalAmount === 0) {
      // Calculate next billing date - 30 days for monthly, 365 days for annual
      const nextBillingDate = new Date();
      if (planType === "monthly") {
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);
      } else {
        nextBillingDate.setDate(nextBillingDate.getDate() + 365);
      }
      
      // Save subscription information
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_type: planType,
          status: "active",
          amount: 0,
          card_last_four: "FREE",
          next_billing_date: nextBillingDate.toISOString(),
          subscription_date: new Date().toISOString()
        });
      
      if (subscriptionError) {
        console.error("Error saving free subscription:", subscriptionError);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Error creating free subscription"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Update discount code usage count if a valid discount was applied
      if (appliedDiscount) {
        const { error: discountUpdateError } = await supabase
          .from("discount_codes")
          .update({ 
            uses_count: supabase.rpc('increment', { row_id: appliedDiscount.id, increment_amount: 1 }) 
          })
          .eq("id", appliedDiscount.id);
          
        if (discountUpdateError) {
          console.error("Error updating discount code usage:", discountUpdateError);
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          transactionId: "FREE-" + Date.now(),
          discountApplied: appliedDiscount ? appliedDiscount.percentage : 0,
          finalAmount: 0,
          message: "Free subscription activated"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // For non-zero amounts, proceed with normal payment processing
    if (!cardData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing required payment information" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    // Determine recurring billing interval
    const recurringBillingInterval = planType === "monthly" ? 1 : 12;
    
    // Create the payment request body
    // Truncate subscription name to avoid MaxLength errors
    const subscriptionName = `SleekPro ${planType === "monthly" ? "Monthly" : "Annual"}`;
    
    // Set up subscription details
    const payload = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey
        },
        refId: Date.now().toString(),
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: finalAmount.toString(),
          payment: {
            creditCard: {
              cardNumber: cardData.cardNumber,
              expirationDate: `${cardData.expiryMonth}${cardData.expiryYear}`,
              cardCode: cardData.cvv
            }
          },
          lineItems: {
            lineItem: {
              itemId: "sub1",
              name: subscriptionName,
              quantity: 1,
              unitPrice: finalAmount.toString()
            }
          },
          tax: {
            amount: "0.00",
            name: "Tax",
            description: "Tax"
          },
          customer: {
            id: userId,
            email: ""
          },
          billTo: billingAddress,
          customerIP: req.headers.get("X-Forwarded-For") || "127.0.0.1",
          // Add subscription details to indicate this is a recurring payment
          subscription: {
            paymentSchedule: {
              interval: {
                length: recurringBillingInterval,
                unit: "months"
              },
              startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
              totalOccurrences: 9999, // Unlimited until canceled
              trialOccurrences: 0
            },
            name: subscriptionName,
            description: `SleekTrade ${planType} Subscription`
          },
          processingOptions: {
            isRecurring: true
          }
        }
      }
    };
    
    // Determine endpoint URL based on environment
    const apiEndpoint = environment === "PRODUCTION" 
      ? "https://api.authorize.net/xml/v1/request.api"
      : "https://apitest.authorize.net/xml/v1/request.api";
    
    console.log("Sending payment request to Authorize.net:", JSON.stringify(payload, null, 2));
    
    // Make the API request to Authorize.net
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log("Response from Authorize.net:", JSON.stringify(result, null, 2));
    
    // Process response
    if (
      result.transactionResponse &&
      result.transactionResponse.responseCode === "1"
    ) {
      // Transaction approved - Create Supabase client
      
      // Calculate next billing date - 30 days for monthly, 365 days for annual
      const nextBillingDate = new Date();
      if (planType === "monthly") {
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);
      } else {
        nextBillingDate.setDate(nextBillingDate.getDate() + 365);
      }
      
      // Save subscription information
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_type: planType,
          status: "active",
          amount: finalAmount,
          card_last_four: cardData.cardNumber.slice(-4),
          next_billing_date: nextBillingDate.toISOString(),
          subscription_date: new Date().toISOString()
        });
      
      if (subscriptionError) {
        console.error("Error saving subscription:", subscriptionError);
        // Even though there was an error saving the subscription, the payment went through,
        // so we'll still return success
      }
      
      // Update discount code usage count if a valid discount was applied
      if (appliedDiscount) {
        const { error: discountUpdateError } = await supabase
          .from("discount_codes")
          .update({ 
            uses_count: supabase.rpc('increment', { row_id: appliedDiscount.id, increment_amount: 1 }) 
          })
          .eq("id", appliedDiscount.id);
          
        if (discountUpdateError) {
          console.error("Error updating discount code usage:", discountUpdateError);
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          transactionId: result.transactionResponse.transId,
          discountApplied: appliedDiscount ? appliedDiscount.percentage : 0,
          finalAmount: finalAmount,
          message: "Payment successful"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Transaction failed
      const errorMessage = 
        result.transactionResponse?.errors?.[0]?.errorText ||
        result.messages?.message?.[0]?.text ||
        "Payment processing failed";
      
      return new Response(
        JSON.stringify({
          success: false,
          message: errorMessage
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
