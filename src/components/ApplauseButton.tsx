import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const APPLAUSE = "👏";

interface ApplauseButtonProps {
  postId: string;
  className?: string;
}

const ApplauseButton = ({ postId, className }: ApplauseButtonProps) => {
  const [count, setCount] = useState(0);
  const [applauded, setApplauded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data: rows } = await supabase
        .from("post_reactions")
        .select("user_id")
        .eq("post_id", postId)
        .eq("emoji", APPLAUSE);
      if (!active) return;
      const { data: auth } = await supabase.auth.getUser();
      setCount(rows?.length ?? 0);
      setApplauded(!!rows?.some((r) => r.user_id === auth.user?.id));
    };

    load();
    return () => {
      active = false;
    };
  }, [postId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        toast.error("Sign in to applaud");
        return;
      }

      if (applauded) {
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId)
          .eq("emoji", APPLAUSE);
        setApplauded(false);
        setCount((c) => Math.max(0, c - 1));
      } else {
        const { error } = await supabase
          .from("post_reactions")
          .insert({ post_id: postId, user_id: userId, emoji: APPLAUSE });
        if (error) throw error;
        setApplauded(true);
        setCount((c) => c + 1);
        setBurst(true);
        setTimeout(() => setBurst(false), 500);
      }
    } catch {
      toast.error("Could not update applause");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={applauded}
      aria-label={applauded ? "Remove applause" : "Applaud this post"}
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold transition-all",
        applauded
          ? "bg-primary/20 text-primary"
          : "bg-background/70 text-foreground hover:bg-primary/10",
        className
      )}
    >
      <span className={cn("text-base transition-transform", burst && "scale-150")}>
        {APPLAUSE}
      </span>
      <span>{count}</span>
    </button>
  );
};

export default ApplauseButton;
