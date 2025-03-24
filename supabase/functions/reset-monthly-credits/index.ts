
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

    // Before we reset, ensure all users have user_credits records
    // This is important for new users who signed up but haven't generated a strategy yet
    await ensureAllUsersHaveCredits(supabaseAdmin);

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

// Ensure all users have user_credits records
async function ensureAllUsersHaveCredits(supabase: any) {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id');
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return;
    }
    
    // Get all users who already have credits
    const { data: existingCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('user_id');
      
    if (creditsError) {
      console.error("Error fetching existing credits:", creditsError);
      return;
    }
    
    // Create a set of user IDs who already have credits
    const existingUserIds = new Set(existingCredits.map((c: any) => c.user_id));
    
    // Find users who don't have credits yet
    const usersWithoutCredits = users.filter((user: any) => !existingUserIds.has(user.id));
    
    if (usersWithoutCredits.length === 0) {
      console.log("All users already have credit records");
      return;
    }
    
    // Create credit records for users who don't have them
    const now = new Date().toISOString();
    const newCreditRecords = usersWithoutCredits.map((user: any) => ({
      user_id: user.id,
      total_credits: 5, // Default starting credits
      used_credits: 0,
      last_reset_date: now
    }));
    
    const { error: insertError } = await supabase
      .from('user_credits')
      .insert(newCreditRecords);
      
    if (insertError) {
      console.error("Error creating credit records for new users:", insertError);
      return;
    }
    
    console.log(`Created credit records for ${usersWithoutCredits.length} new users`);
  } catch (error) {
    console.error("Error in ensureAllUsersHaveCredits:", error);
  }
}
