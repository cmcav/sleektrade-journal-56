
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
    // Initialize Supabase admin client with service role key
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase URL or service role key');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key is not configured. Please add it to your Supabase project secrets.',
          strategy: null
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { symbol, timeframe, riskLevel, strategyName } = await req.json();
    
    // Get user ID from the JWT token in the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authentication token', strategy: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token', strategy: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const userId = user.id;
    
    // Check if user has available credits
    const { data: creditData, error: creditError } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (creditError) {
      console.error('Error fetching user credits:', creditError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify credit status', strategy: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!creditData) {
      // Create credits for user if not exists (fallback)
      const { error: insertError } = await supabaseAdmin
        .from('user_credits')
        .insert({ user_id: userId });
        
      if (insertError) {
        console.error('Error creating user credits:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to initialize credits', strategy: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Fetch the newly created credits
      const { data: newCreditData, error: newCreditError } = await supabaseAdmin
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (newCreditError || !newCreditData) {
        console.error('Error fetching new user credits:', newCreditError);
        return new Response(
          JSON.stringify({ error: 'Failed to initialize credits', strategy: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      if (newCreditData.used_credits >= newCreditData.total_credits) {
        return new Response(
          JSON.stringify({ 
            error: 'You have used all your credits for this month. Upgrade to premium for more credits.',
            strategy: null,
            creditsRemaining: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    } else if (creditData.used_credits >= creditData.total_credits) {
      return new Response(
        JSON.stringify({ 
          error: 'You have used all your credits for this month. Upgrade to premium for more credits.',
          strategy: null,
          creditsRemaining: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Craft a specific prompt for trading strategy generation
    const prompt = `Generate a detailed trading strategy based on the following parameters:
    - Strategy Name: ${strategyName}
    - Symbol: ${symbol}
    - Timeframe: ${timeframe}
    - Risk Level (1-10): ${riskLevel} (higher means more aggressive)
    
    The strategy should include:
    1. Entry Conditions - specific technical indicators or price patterns to look for
    2. Exit Conditions - including take profit and stop loss levels
    3. Risk Management rules appropriate for the risk level
    4. Any additional considerations for this specific symbol and timeframe
    
    Format the response in Markdown with clear sections for each component of the strategy.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using a cost-effective yet powerful model
        messages: [
          { role: 'system', content: 'You are an expert trading strategy developer specializing in technical analysis and algorithmic trading. Provide detailed, actionable trading strategies that include specific entry and exit rules.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Handle quota exceeded error specifically
      if (errorData.error?.message?.includes('quota')) {
        return new Response(
          JSON.stringify({ 
            error: 'OpenAI API quota exceeded. Please check your OpenAI account billing or try again later.',
            strategy: null 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Handle any other API errors
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
          strategy: null 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    const generatedStrategy = data.choices[0].message.content;

    // Update user's credit usage
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({ 
        used_credits: creditData ? creditData.used_credits + 1 : 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      // Continue anyway, don't block the response
    }

    // Calculate remaining credits
    const creditsRemaining = creditData 
      ? Math.max(0, creditData.total_credits - (creditData.used_credits + 1)) 
      : 4; // If creditData was null and we just created it, default is 5 and we used 1

    // Return the generated strategy
    return new Response(
      JSON.stringify({ 
        strategy: generatedStrategy, 
        error: null, 
        creditsRemaining
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-trading-strategy function:', error);
    return new Response(
      JSON.stringify({ 
        error: `Error generating strategy: ${error.message}`,
        strategy: null 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
