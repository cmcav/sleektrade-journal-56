
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// This function securely returns the Authorize.net client key 
// which is needed on the frontend to tokenize card details
serve(async (req) => {
  // Get API keys from environment variables
  const clientKey = Deno.env.get("AUTHNET_CLIENT_KEY");
  const environment = Deno.env.get("AUTHNET_ENVIRONMENT") || "SANDBOX";
  
  if (!clientKey) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Authorize.net configuration is missing" 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    );
  }
  
  // Return only the client key and environment which are needed on the frontend
  return new Response(
    JSON.stringify({
      success: true,
      clientKey,
      environment
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
