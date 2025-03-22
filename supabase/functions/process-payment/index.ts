
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";
import { handleAuthorizeNetPayment } from "./payment-processor.ts";
import { validateRequest, validatePayment, sanitizeCardData, sanitizeBillingAddress } from "./validation.ts";
import { handleFreeSubscription, saveSubscription, updateDiscountUsage } from "./subscription-manager.ts";
import { corsHeaders } from "./cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const { cardData, amount, planType, billingAddress, discountCode } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Validate the request and extract user ID
    const { isValid, userId, error } = await validateRequest(req, supabase);
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, message: error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    // Validate payment details
    const { isValid: isPaymentValid, finalAmount, appliedDiscount, error: paymentError } = 
      await validatePayment(amount, discountCode, supabase);
    
    if (!isPaymentValid) {
      return new Response(
        JSON.stringify({ success: false, message: paymentError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Handle free subscriptions (when amount is 0)
    if (finalAmount === 0) {
      const result = await handleFreeSubscription(userId, planType, appliedDiscount, supabase);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process payment for non-zero amounts
    if (!cardData) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required payment information" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Sanitize sensitive data
    const sanitizedCardData = sanitizeCardData(cardData);
    const sanitizedBillingAddress = sanitizeBillingAddress(billingAddress);
    
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
      // Save subscription if payment was successful
      const subscriptionError = await saveSubscription({
        userId,
        planType,
        amount: finalAmount,
        cardLastFour: sanitizedCardData.cardNumber.slice(-4),
        supabase
      });
      
      if (subscriptionError) {
        console.error("Error saving subscription:", subscriptionError);
      }
      
      // Update discount code usage if applicable
      if (appliedDiscount) {
        await updateDiscountUsage(appliedDiscount.id, supabase);
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
