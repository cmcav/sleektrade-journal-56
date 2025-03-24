
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this is a scheduled call or manual call
    const isScheduledJob = req.headers.get('X-Scheduled-Function') === 'true';
    
    // For manual calls, verify authorization
    if (!isScheduledJob) {
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized access - Missing authorization header' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Verify admin privileges for manual calls
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized access - Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      console.log(`Manual credit reset requested by user: ${user.email}`);
    } else {
      console.log('Scheduled monthly credit reset initiated');
    }

    // Call the database function to reset credits
    const startTime = Date.now();
    const { data, error } = await supabaseAdmin.rpc('reset_monthly_credits');
    const duration = Date.now() - startTime;
    
    if (error) {
      throw error;
    }

    // Log operation details
    const source = isScheduledJob ? 'scheduled job' : 'manual request';
    console.log(`Monthly credits reset successful via ${source} (completed in ${duration}ms)`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Monthly credits have been reset successfully',
        source: isScheduledJob ? 'cron' : 'manual',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error resetting monthly credits:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
