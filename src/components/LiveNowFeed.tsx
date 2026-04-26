import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Radio, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type Stream = {
  id: string;
  title: string;
  description: string | null;
  status: "scheduled" | "live" | "ended";
  scheduled_at: string | null;
  started_at: string | null;
  viewers_count: number;
  user_id: string;
  thumbnail_url: string | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
};

interface LiveNowFeedProps {
  /** When true, renders a compact horizontal strip (for embedding in the home feed). */
  compact?: boolean;
  /** Limit number of streams shown */
  limit?: number;
}

export const LiveNowFeed = ({ compact = false, limit = 12 }: LiveNowFeedProps) => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStreams = async () => {
    // 1) Live streams
    const { data: liveData } = await supabase
      .from("live_streams")
      .select("*")
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(limit);

    // 2) Upcoming scheduled streams
    const { data: scheduledData } = !compact
      ? await supabase
          .from("live_streams")
          .select("*")
          .eq("status", "scheduled")
          .gt("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(limit)
      : { data: [] as any[] };

    const combined = [...(liveData || []), ...(scheduledData || [])];

    // Hydrate profiles
    const ids = Array.from(new Set(combined.map((s) => s.user_id)));
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name")
        .in("id", ids);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      setStreams(
        combined.map((s) => ({
          ...s,
          profiles: profileMap.get(s.user_id) ?? null,
        })) as Stream[]
      );
    } else {
      setStreams([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStreams();

    // Realtime updates so going live is reflected immediately
    const channel = supabase
      .channel("live_streams_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_streams" },
        () => fetchStreams()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, limit]);

  const liveStreams = streams.filter((s) => s.status === "live");
  const upcoming = streams.filter((s) => s.status === "scheduled");

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-40 shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  if (compact) {
    if (liveStreams.length === 0) return null;
    return (
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <Badge variant="destructive" className="shrink-0 gap-1 px-2 py-1">
          <Radio className="h-3 w-3 animate-pulse" />
          LIVE NOW
        </Badge>
        {liveStreams.map((s) => (
          <button
            key={s.id}
            className="group flex shrink-0 items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-left transition-colors hover:bg-destructive/10"
          >
            <Avatar className="h-8 w-8 ring-2 ring-destructive">
              <AvatarImage src={s.profiles?.avatar_url ?? undefined} />
              <AvatarFallback>
                {(s.profiles?.username ?? "L")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-[140px]">
              <p className="line-clamp-1 text-xs font-semibold">{s.title}</p>
              <p className="line-clamp-1 text-[10px] text-muted-foreground">
                @{s.profiles?.username ?? "athlete"} · {s.viewers_count} 👁
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {liveStreams.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="destructive" className="gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              LIVE NOW
            </Badge>
            <h3 className="text-sm font-semibold text-muted-foreground">
              {liveStreams.length} streaming
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveStreams.map((s) => (
              <Card key={s.id} className="overflow-hidden border-destructive/40">
                <div className="aspect-video w-full bg-gradient-to-br from-destructive/30 to-primary/20 flex items-center justify-center">
                  {s.thumbnail_url ? (
                    <img
                      src={s.thumbnail_url}
                      alt={s.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Radio className="h-12 w-12 text-destructive animate-pulse" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="line-clamp-1 font-semibold">{s.title}</h4>
                    <Badge variant="destructive" className="gap-1">
                      <Radio className="h-3 w-3 animate-pulse" />
                      LIVE
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={s.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {(s.profiles?.username ?? "L")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>@{s.profiles?.username ?? "athlete"}</span>
                    <span className="ml-auto flex items-center gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      {s.viewers_count}
                    </span>
                  </div>
                  {s.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Upcoming streams
          </h3>
          <div className="space-y-2">
            {upcoming.map((s) => (
              <Card key={s.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={s.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {(s.profiles?.username ?? "L")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      @{s.profiles?.username ?? "athlete"} ·{" "}
                      {s.scheduled_at
                        ? format(new Date(s.scheduled_at), "PPp")
                        : "TBD"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Remind me
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {liveStreams.length === 0 && upcoming.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Radio className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No live or upcoming streams right now.</p>
        </div>
      )}
    </div>
  );
};

export default LiveNowFeed;
