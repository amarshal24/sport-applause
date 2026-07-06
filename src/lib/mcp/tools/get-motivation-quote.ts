declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const MOODS = [
  "motivated", "relaxed", "intense", "focused",
  "energetic", "calm", "pumped", "determined",
] as const;

export default defineTool({
  name: "get_motivation_quote",
  title: "Get a motivational quote",
  description: "Generate an AI-powered motivational quote for an athlete based on their current mood.",
  inputSchema: {
    mood: z.enum(MOODS).describe("Athlete's current mood."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ mood }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { content: [{ type: "text", text: "LOVABLE_API_KEY not configured" }], isError: true };
    }
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an inspirational coach. Return one short, powerful motivational quote (1-2 sentences) for an athlete." },
          { role: "user", content: `Generate a motivational quote for someone feeling ${mood}.` },
        ],
      }),
    });
    if (!res.ok) {
      return { content: [{ type: "text", text: `AI gateway error ${res.status}` }], isError: true };
    }
    const data = await res.json();
    const quote = data.choices?.[0]?.message?.content?.trim() ?? "";
    return {
      content: [{ type: "text", text: quote }],
      structuredContent: { quote, mood },
    };
  },
});
