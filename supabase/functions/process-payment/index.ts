
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";
import { handleAuthorizeNetPayment } from "./payment-processor.ts";
import { validateRequest, validatePayment, sanitizeCardData, sanitizeBillingAddress } from "./validation.ts";
import { sanitizePaymentInput } from "../validate-input.ts";
import { handleFreeSubscription, saveSubscription, updateDiscountUsage } from "./subscription-manager.ts";
import { corsHeaders } from "./cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Process payment function called");
    
    // Parse and sanitize request body
    const rawBody = await req.json();
    console.log("Processing payment request:", JSON.stringify({
      ...rawBody,
      cardData: rawBody.cardData ? "REDACTED" : undefined
    }));
    
    const { cardData, amount, planType, billingAddress, discountCode } = sanitizePaymentInput(rawBody);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create admin client to bypass RLS
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = serviceRoleKey ? 
      createClient(supabaseUrl, serviceRoleKey) : 
      supabase;
    
    // Validate the request and extract user ID
    const { isValid, userId, error } = await validateRequest(req, supabase);
    if (!isValid) {
      console.error("Invalid request:", error);
      return new Response(
        JSON.stringify({ success: false, message: error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    console.log("Request validated for user:", userId);
    
    // Validate payment details
    const { isValid: isPaymentValid, finalAmount, appliedDiscount, error: paymentError } = 
      await validatePayment(amount, discountCode, supabase);
    
    if (!isPaymentValid) {
      console.error("Invalid payment details:", paymentError);
      return new Response(
        JSON.stringify({ success: false, message: paymentError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log("Payment validated, final amount:", finalAmount);
    
    // Handle free subscriptions (when amount is 0)
    if (finalAmount === 0) {
      console.log("Processing free subscription");
      const result = await handleFreeSubscription(userId, planType, appliedDiscount, supabaseAdmin);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process payment for non-zero amounts
    if (!cardData) {
      console.error("Missing card data for paid subscription");
      return new Response(
        JSON.stringify({ success: false, message: "Missing required payment information" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Legacy sanitization kept for backward compatibility
    const sanitizedCardData = sanitizeCardData(cardData);
    const sanitizedBillingAddress = sanitizeBillingAddress(billingAddress);
    
    console.log("Processing payment with Authorize.net");
    
    // Handle payment with Authorize.net
    const paymentResult = await handleAuthorizeNetPayment({
      cardData: sanitizedCardData,
      amount: finalAmount,
      planType,
      billingAddress: sanitizedBillingAddress,
      userId,
      clientIp: req.headers.get("X-Forwarded-For") || "127.0.0.1"
    });
    
    if (paymentResult.success) {
      console.log("Payment successful, saving subscription");
      
      // Save subscription if payment was successful
      const subscriptionError = await saveSubscription({
        userId,
        planType,
        amount: finalAmount,
        cardLastFour: sanitizedCardData.cardNumber.slice(-4),
        supabase: supabaseAdmin // Use admin client to bypass RLS
      });
      
      if (subscriptionError) {
        console.error("Error saving subscription:", subscriptionError);
      }
      
      // Update discount code usage if applicable
      if (appliedDiscount) {
        await updateDiscountUsage(appliedDiscount.id, supabaseAdmin);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: paymentResult.success,
        transactionId: paymentResult.transactionId,
        discountApplied: appliedDiscount ? appliedDiscount.percentage : 0,
        finalAmount,
        message: paymentResult.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing payment:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
