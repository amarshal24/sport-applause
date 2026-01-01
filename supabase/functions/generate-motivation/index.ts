import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, contentType, religion } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (contentType === 'prayer') {
      systemPrompt = `You are a spiritual guide who creates heartfelt, authentic prayers. Generate prayers that are respectful, uplifting, and appropriate for the specified religion. Keep prayers concise (2-4 sentences) but meaningful.`;
      userPrompt = `Generate a ${religion} prayer for someone who is feeling ${mood}. The prayer should be comforting, authentic to the ${religion} tradition, and help them feel connected to their faith. Return ONLY a JSON object with this exact format: {"prayer": "the prayer text", "blessing": "a short closing blessing or phrase"}`;
    } else {
      systemPrompt = `You are an inspirational coach who creates personalized motivational quotes. Generate uplifting, powerful quotes that resonate with athletes and anyone pursuing excellence. Keep quotes concise and impactful.`;
      userPrompt = `Generate an original motivational quote for someone who is feeling ${mood}. The quote should be uplifting and help them feel empowered. Return ONLY a JSON object with this exact format: {"quote": "the motivational quote", "reflection": "a brief one-sentence reflection on the quote's meaning"}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response from the AI
    let parsedContent;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      // Fallback: return the raw content
      parsedContent = contentType === 'prayer' 
        ? { prayer: content, blessing: '' }
        : { quote: content, reflection: '' };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      contentType,
      mood,
      religion: contentType === 'prayer' ? religion : null,
      ...parsedContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-motivation:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
