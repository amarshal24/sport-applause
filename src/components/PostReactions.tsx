import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";

// Sport-friendly reaction set
export const REACTION_EMOJIS = [
  { emoji: "👏", label: "Applause" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💯", label: "100" },
  { emoji: "🏆", label: "Trophy" },
] as const;

type ReactionRow = {
  emoji: string;
  user_id: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

interface PostReactionsProps {
  postId: string;
  /** Used as a fallback baseline so existing legacy likes_count still shows on top emoji */
  legacyLikesCount?: number;
  /** Compact mode renders a single tappable emoji row (no leaderboard). */
  compact?: boolean;
}

export const PostReactions = ({
  postId,
  legacyLikesCount = 0,
  compact = false,
}: PostReactionsProps) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bursts, setBursts] = useState<Array<{ id: string; emoji: string }>>([]);

  const fetchReactions = async () => {
    const { data: reactionData } = await supabase
      .from("post_reactions")
      .select("emoji, user_id")
      .eq("post_id", postId);

    if (!reactionData || reactionData.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(reactionData.map((r) => r.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);
    const map = new Map((profiles || []).map((p) => [p.id, p]));

    setRows(
      reactionData.map((r) => ({
        ...r,
        profiles: map.get(r.user_id) ?? null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchReactions();
    const channel = supabase
      .channel(`post_reactions_${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_reactions",
          filter: `post_id=eq.${postId}`,
        },
        () => fetchReactions()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Aggregate counts per emoji
  const counts = new Map<string, number>();
  REACTION_EMOJIS.forEach((r) => counts.set(r.emoji, 0));
  rows.forEach((r) => counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1));

  // Apply legacy applause baseline to 👏 only
  if (legacyLikesCount > 0) {
    counts.set("👏", (counts.get("👏") ?? 0) + legacyLikesCount);
  }

  // Has the current user reacted with X?
  const userReacted = (emoji: string) =>
    !!user && rows.some((r) => r.user_id === user.id && r.emoji === emoji);

  // Top reactors: count distinct users by total reactions
  const reactorMap = new Map<
    string,
    { user_id: string; profile: ReactionRow["profiles"]; total: number }
  >();
  rows.forEach((r) => {
    const cur = reactorMap.get(r.user_id);
    if (cur) cur.total += 1;
    else
      reactorMap.set(r.user_id, {
        user_id: r.user_id,
        profile: r.profiles,
        total: 1,
      });
  });
  const topReactors = Array.from(reactorMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const triggerBurst = (emoji: string) => {
    const id = `${emoji}-${Date.now()}-${Math.random()}`;
    setBursts((b) => [...b, { id, emoji }]);
    setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== id));
    }, 900);
  };

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    if (userReacted(emoji)) {
      // Remove
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      triggerBurst(emoji);
      await supabase.from("post_reactions").insert({
        post_id: postId,
        user_id: user.id,
        emoji,
      });
    }
    fetchReactions();
  };

  return (
    <div className="relative space-y-2">
      {/* Burst overlay */}
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.div
            key={b.id}
            className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 text-5xl"
            initial={{ opacity: 0, scale: 0.4, y: 10 }}
            animate={{ opacity: 1, scale: 1.4, y: -40 }}
            exit={{ opacity: 0, scale: 0.6, y: -80 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {b.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reaction tray */}
      <div className="flex items-center gap-1 sm:gap-2">
        {REACTION_EMOJIS.map(({ emoji, label }) => {
          const reacted = userReacted(emoji);
          const count = counts.get(emoji) ?? 0;
          return (
            <button
              key={emoji}
              type="button"
              aria-label={label}
              onClick={() => toggleReaction(emoji)}
              disabled={!user}
              className={cn(
                "group flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-all",
                "hover:scale-110 active:scale-95",
                reacted
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <motion.span
                animate={reacted ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="text-lg leading-none"
              >
                {emoji}
              </motion.span>
              <span className="text-xs font-semibold tabular-nums">
                {count > 0 ? count : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Top reactors leaderboard */}
      {!compact && topReactors.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <Crown className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium text-muted-foreground">
            Top fans
          </span>
          <div className="flex -space-x-2">
            {topReactors.map((r, idx) => (
              <Avatar
                key={r.user_id}
                className={cn(
                  "h-6 w-6 border-2 border-background",
                  idx === 0 && "ring-2 ring-primary"
                )}
                title={`@${r.profile?.username ?? "fan"} · ${r.total} reactions`}
              >
                <AvatarImage src={r.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px]">
                  {(r.profile?.username ?? "F")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostReactions;
