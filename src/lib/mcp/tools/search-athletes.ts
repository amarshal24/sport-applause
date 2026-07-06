declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_athletes",
  title: "Search athletes",
  description: "Search U⚡️Sportz athlete profiles by name, sport, or position.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to match against username, full name, sport, or position."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const like = `%${query}%`;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, sport, position, bio, avatar_url")
      .or(
        `username.ilike.${like},full_name.ilike.${like},sport.ilike.${like},position.ilike.${like}`,
      )
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { athletes: data ?? [] },
    };
  },
});
