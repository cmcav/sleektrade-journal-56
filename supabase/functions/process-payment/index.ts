
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    // Parse request body
    const { cardData, amount, planType, billingAddress } = await req.json();
    
    if (!cardData || !amount) {
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
            id: "1",
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
      // Transaction approved
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
