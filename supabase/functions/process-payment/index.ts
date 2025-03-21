
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
    const { cardData, amount, planType, billingAddress, userId } = await req.json();
    
    if (!cardData || !amount || !userId) {
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
    
    // Create the payment request body
    // Truncate subscription name to avoid MaxLength errors
    const subscriptionName = `SleekPro ${planType === "monthly" ? "Monthly" : "Annual"}`;
    
    const payload = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey
        },
        refId: Date.now().toString(),
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amount.toString(),
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
              unitPrice: amount.toString()
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
          customerIP: req.headers.get("X-Forwarded-For") || "127.0.0.1"
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
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
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
          amount: amount,
          card_last_four: cardData.cardNumber.slice(-4),
          next_billing_date: nextBillingDate.toISOString(),
          subscription_date: new Date().toISOString()
        });
      
      if (subscriptionError) {
        console.error("Error saving subscription:", subscriptionError);
        // Even though there was an error saving the subscription, the payment went through,
        // so we'll still return success
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          transactionId: result.transactionResponse.transId,
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
