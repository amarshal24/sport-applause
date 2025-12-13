import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid input options for validation
const VALID_MOODS = ['motivated', 'relaxed', 'intense', 'focused', 'energetic', 'calm', 'pumped', 'determined'];
const VALID_SPORTS = [
  'basketball', 'football', 'soccer', 'baseball', 'tennis', 'golf', 'swimming', 
  'running', 'cycling', 'boxing', 'mma', 'volleyball', 'hockey', 'lacrosse',
  'track', 'gymnastics', 'wrestling', 'weightlifting', 'crossfit', 'yoga',
  'general sports'
];

// Sanitize and validate input
function validateInput(value: string | undefined, validOptions: string[], defaultValue: string): string {
  if (!value || typeof value !== 'string') return defaultValue;
  const sanitized = value.toLowerCase().trim().slice(0, 50); // Limit length
  return validOptions.includes(sanitized) ? sanitized : defaultValue;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    
    // Validate and sanitize inputs
    const mood = validateInput(body?.mood, VALID_MOODS, 'motivated');
    const sport = validateInput(body?.sport, VALID_SPORTS, 'general sports');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`Processing music recommendation request - mood: ${mood}, sport: ${sport}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a sports music curator. Generate workout and training music recommendations for athletes based on their sport and mood. Return exactly 6 songs with artist, title, genre, and why it matches their activity. Format as JSON array with objects containing: artist, title, genre, description."
          },
          {
            role: "user",
            content: `Recommend 6 workout songs for ${sport} athletes feeling ${mood}. Focus on high-energy tracks that enhance athletic performance.`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    const recommendations = JSON.parse(content);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("music-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
