import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_trending_posts",
  title: "List trending posts",
  description:
    "List recent posts from the U⚡️Sportz feed, ordered by most recent, visible to the signed-in user.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max posts to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const q = supabase
      .from("posts")
      .select("id, content, video_url, image_url, likes_count, comments_count, created_at")
      .order("likes_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});
