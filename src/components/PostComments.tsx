import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, Trash2 } from "lucide-react";

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

interface PostCommentsProps {
  postId: string;
  open: boolean;
  onCountChange?: (delta: number) => void;
}

const PostComments = ({ postId, open, onCountChange }: PostCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const db = supabase as any;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("post_comments")
        .select("id, content, created_at, user_id, profiles:user_id(username, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Could not load comments. Apply the post_comments migration if this table is missing.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (open) fetchComments();
  }, [open, fetchComments]);

  const bumpCount = async (delta: number) => {
    onCountChange?.(delta);
    const { data: post } = await supabase
      .from("posts")
      .select("comments_count")
      .eq("id", postId)
      .single();
    if (!post) return;
    const next = Math.max(0, (post.comments_count ?? 0) + delta);
    await supabase.from("posts").update({ comments_count: next }).eq("id", postId);
  };

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    const content = text.trim();
    if (!content) return;

    setSubmitting(true);
    try {
      const { data, error } = await db
        .from("post_comments")
        .insert({ post_id: postId, user_id: user.id, content })
        .select("id, content, created_at, user_id")
        .single();

      if (error) throw error;

      setComments((prev) => [
        ...prev,
        {
          ...data,
          profiles: {
            username: user.user_metadata?.username ?? "you",
            avatar_url: null,
          },
        },
      ]);
      setText("");
      await bumpCount(1);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const { error } = await db.from("post_comments").delete().eq("id", id);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== id));
      await bumpCount(-1);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  if (!open) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3 space-y-3">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-3 max-h-56 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2 items-start">
              <Avatar className="h-7 w-7">
                <AvatarImage src={c.profiles?.avatar_url || undefined} />
                <AvatarFallback>{(c.profiles?.username || "?")[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">@{c.profiles?.username || "user"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                  {user?.id === c.user_id && (
                    <button
                      type="button"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => remove(c.id)}
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 break-words">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Write a comment…" : "Sign in to comment"}
          disabled={!user || submitting}
          className="min-h-[60px] resize-none"
          maxLength={500}
        />
        <Button size="icon" disabled={!user || submitting || !text.trim()} onClick={submit}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default PostComments;
