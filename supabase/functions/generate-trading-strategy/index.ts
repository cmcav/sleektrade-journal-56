
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const { symbol, timeframe, riskLevel, strategyName } = await req.json();

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

    // Return the generated strategy
    return new Response(
      JSON.stringify({ strategy: generatedStrategy, error: null }),
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
