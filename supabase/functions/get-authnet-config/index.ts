
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function securely returns the Authorize.net signature key 
// which is needed on the frontend to tokenize card details
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Get API keys from environment variables
  const apiLoginId = Deno.env.get("AUTHNET_API_LOGIN_ID");
  const signatureKey = Deno.env.get("AUTHNET_SIGNATURE_KEY");
  const environment = Deno.env.get("AUTHNET_ENVIRONMENT") || "SANDBOX";
  
  if (!apiLoginId || !signatureKey) {
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
  
  // Return the API login ID, signature key and environment which are needed on the frontend
  return new Response(
    JSON.stringify({
      success: true,
      apiLoginId,
      signatureKey,
      environment
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
