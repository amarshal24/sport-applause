import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "viewed_posts";

function seen(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

/**
 * Records a view for a post (once per browser session per post).
 * Used to rank trending highlights by recent views.
 */
export async function logPostView(postId: string) {
  if (!postId) return;
  const viewed = seen();
  if (viewed.has(postId)) return;
  viewed.add(postId);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...viewed]));
  } catch {
    /* ignore quota errors */
  }

  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return;
  await supabase.from("post_views").insert({ post_id: postId, viewer_id: uid });
}
