import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AthleteInput {
  sport: string;
  height: string;
  weight: string;
  position?: string;
  stats?: Record<string, string | number>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { athleteData } = await req.json() as { athleteData: AthleteInput };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a sports analytics expert who matches amateur athletes to professional athletes based on their physical attributes and stats. 

Given an athlete's profile (sport, height, weight, position, and stats), find 3-5 current or past professional athletes who have similar physical profiles or play styles.

For each match, provide:
1. The pro athlete's name
2. Their team (current or former)
3. Their height and weight
4. A similarity score (1-100)
5. A brief explanation of why they're a good comparison

Focus on realistic comparisons that can inspire the athlete. Consider body type, position, and playing style when available.`;

    const userPrompt = `Find professional athlete comparisons for this ${athleteData.sport} player:
- Height: ${athleteData.height}
- Weight: ${athleteData.weight}
${athleteData.position ? `- Position: ${athleteData.position}` : ''}
${athleteData.stats ? `- Stats: ${JSON.stringify(athleteData.stats)}` : ''}

Return matches as JSON with this structure.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_athlete_matches",
              description: "Return athlete comparison matches",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Pro athlete name" },
                        team: { type: "string", description: "Current or former team" },
                        height: { type: "string", description: "Height (e.g., 6'2\")" },
                        weight: { type: "string", description: "Weight (e.g., 185 lbs)" },
                        position: { type: "string", description: "Position played" },
                        similarityScore: { type: "number", description: "Match score 1-100" },
                        explanation: { type: "string", description: "Why they're a good comparison" },
                        careerHighlights: { type: "string", description: "Notable achievements" },
                      },
                      required: ["name", "team", "height", "weight", "similarityScore", "explanation"],
                    },
                  },
                  overallAnalysis: {
                    type: "string",
                    description: "Overall analysis of the athlete's profile and potential",
                  },
                },
                required: ["matches", "overallAnalysis"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_athlete_matches" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Athlete matcher error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
