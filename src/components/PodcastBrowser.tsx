import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SecureAudio, SecureImage } from "@/components/SecureMedia";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Headphones, Loader2, Mic, Pause, Play, Search } from "lucide-react";
import { toast } from "sonner";
import { useDeafAccessibility } from "@/hooks/useDeafAccessibility";
import { cn } from "@/lib/utils";

export interface CommunityPodcast {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  plays_count: number;
  likes_count: number;
  created_at: string;
  user_id: string;
  creator?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

type SortMode = "latest" | "popular";

const formatDuration = (seconds: number | null) => {
  if (!seconds || seconds < 0 || !Number.isFinite(seconds)) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatPlays = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

interface PodcastBrowserProps {
  /** When set, auto-select and scroll to this podcast (e.g. from Search). */
  focusId?: string | null;
  onFocusConsumed?: () => void;
}

const PodcastBrowser = ({ focusId, onFocusConsumed }: PodcastBrowserProps) => {
  const navigate = useNavigate();
  const { preferCaptions } = useDeafAccessibility();
  const [items, setItems] = useState<CommunityPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("latest");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const countedPlays = useRef<Set<string>>(new Set());
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("podcasts")
      .select(
        "id, title, description, audio_url, thumbnail_url, duration, plays_count, likes_count, created_at, user_id"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const podcasts = (data ?? []) as CommunityPodcast[];
    const userIds = [...new Set(podcasts.map((p) => p.user_id))];

    let profileMap = new Map<string, CommunityPodcast["creator"]>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);
      profileMap = new Map(
        (profiles ?? []).map((p) => [
          p.id,
          { username: p.username, full_name: p.full_name, avatar_url: p.avatar_url },
        ])
      );
    }

    setItems(
      podcasts.map((p) => ({
        ...p,
        creator: profileMap.get(p.user_id) ?? null,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focusId || loading || items.length === 0) return;
    const exists = items.some((p) => p.id === focusId);
    if (!exists) {
      onFocusConsumed?.();
      return;
    }
    setActiveId(focusId);
    setPlaying(true);
    requestAnimationFrame(() => {
      rowRefs.current.get(focusId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    onFocusConsumed?.();
  }, [focusId, loading, items, onFocusConsumed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          (p.creator?.username?.toLowerCase().includes(q) ?? false) ||
          (p.creator?.full_name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (sort === "popular") {
      list = [...list].sort((a, b) => b.plays_count - a.plays_count);
    }
    return list;
  }, [items, search, sort]);

  const recordPlay = async (podcast: CommunityPodcast) => {
    if (countedPlays.current.has(podcast.id)) return;
    countedPlays.current.add(podcast.id);
    setItems((prev) =>
      prev.map((p) =>
        p.id === podcast.id ? { ...p, plays_count: p.plays_count + 1 } : p
      )
    );
    // Best-effort: RLS only allows owners to update. Non-owner plays stay local.
    await supabase
      .from("podcasts")
      .update({ plays_count: podcast.plays_count + 1 })
      .eq("id", podcast.id);
  };

  const togglePlay = (podcast: CommunityPodcast) => {
    if (activeId === podcast.id) {
      const el = document.getElementById("podcast-now-playing") as HTMLAudioElement | null;
      if (el) {
        if (!el.paused) {
          el.pause();
          setPlaying(false);
        } else {
          void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        }
      } else {
        setPlaying((p) => !p);
      }
      return;
    }
    setActiveId(podcast.id);
    setPlaying(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search podcasts..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={sort === "latest" ? "default" : "outline"}
            onClick={() => setSort("latest")}
          >
            Latest
          </Button>
          <Button
            size="sm"
            variant={sort === "popular" ? "default" : "outline"}
            onClick={() => setSort("popular")}
          >
            Most played
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Headphones className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground mb-1">No podcasts yet</p>
          <p className="text-sm">Be the first to upload an episode in My Podcasts.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const isActive = activeId === p.id;
            const creatorLabel =
              p.creator?.full_name || p.creator?.username || "Athlete";
            return (
              <li
                key={p.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(p.id, el);
                  else rowRefs.current.delete(p.id);
                }}
                className={`rounded-lg border bg-card p-4 transition-colors ${
                  isActive ? "border-primary/50 bg-primary/5" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => togglePlay(p)}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0 group"
                    aria-label={isActive && playing ? `Pause ${p.title}` : `Play ${p.title}`}
                  >
                    {p.thumbnail_url ? (
                      <SecureImage
                        src={p.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Mic className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isActive && playing ? (
                        <Pause className="h-7 w-7 text-white" />
                      ) : (
                        <Play className="h-7 w-7 text-white fill-white" />
                      )}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{p.title}</h3>
                        <button
                          type="button"
                          className="text-sm text-muted-foreground hover:text-primary truncate"
                          onClick={() => navigate(`/athlete/${p.user_id}`)}
                        >
                          {creatorLabel}
                        </button>
                      </div>
                      <Button
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        className="shrink-0 gap-1"
                        onClick={() => togglePlay(p)}
                      >
                        {isActive && playing ? (
                          <>
                            <Pause className="h-4 w-4" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" /> Play
                          </>
                        )}
                      </Button>
                    </div>
                    {p.description && (
                      <p
                        className={cn(
                          "text-sm text-muted-foreground mt-1",
                          !(preferCaptions && isActive) && "line-clamp-2",
                        )}
                      >
                        {p.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(p.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {formatPlays(p.plays_count)} plays
                      </span>
                    </div>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {preferCaptions && (
                      <div
                        className="rounded-lg border bg-muted/60 p-3 space-y-1"
                        role="status"
                        aria-live="polite"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Text alternative
                        </p>
                        <p className="text-sm font-medium text-foreground">{p.title}</p>
                        {p.description ? (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {p.description}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No description available for this podcast.
                          </p>
                        )}
                      </div>
                    )}
                    <SecureAudio
                      id="podcast-now-playing"
                      key={p.id}
                      src={p.audio_url}
                      controls
                      autoPlay
                      className="w-full h-10"
                      onPlay={() => {
                        setPlaying(true);
                        void recordPlay(p);
                      }}
                      onPause={() => setPlaying(false)}
                      onEnded={() => setPlaying(false)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PodcastBrowser;
