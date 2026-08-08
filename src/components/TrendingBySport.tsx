import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Flame, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SPORTS, getSportName } from "@/constants/sports";
import { InlineSportIcon } from "@/components/SportIcon";
import { SecureVideo, SecureImage } from "@/components/SecureMedia";
import { logPostView } from "@/lib/postViews";
import { cn } from "@/lib/utils";

interface TrendingRow {
  post_id: string;
  user_id: string;
  content: string;
  video_url: string | null;
  image_url: string | null;
  created_at: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  sports: string[] | null;
  views_count: number;
  applause_count: number;
  likes_count: number;
  comments_count: number;
  score: number;
}

const RANGES = [
  { id: 1, label: "24h" },
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
];

const TrendingBySport = () => {
  const navigate = useNavigate();
  const [sport, setSport] = useState<string>("all");
  const [days, setDays] = useState<number>(7);
  const [rows, setRows] = useState<TrendingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_trending_highlights", {
        _days: days,
        _sport: sport === "all" ? null : sport,
        _limit: 30,
      });
      if (!cancelled) {
        if (!error && data) setRows(data as unknown as TrendingRow[]);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sport, days]);

  const highlights = useMemo(() => rows.filter((r) => r.video_url || r.image_url), [rows]);

  return (
    <div className="space-y-5">
      {/* Sport filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={sport === "all" ? "default" : "outline"}
          onClick={() => setSport("all")}
        >
          All Sports
        </Button>
        {SPORTS.map((s) => {
          const Icon = s.icon;
          return (
            <Button
              key={s.id}
              size="sm"
              variant={sport === s.id ? "default" : "outline"}
              onClick={() => setSport(s.id)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {s.name}
            </Button>
          );
        })}
      </div>

      {/* Time range */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Ranked over</span>
        {RANGES.map((r) => (
          <Button
            key={r.id}
            size="sm"
            variant={days === r.id ? "secondary" : "ghost"}
            onClick={() => setDays(r.id)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Ranking highlights...
        </div>
      ) : highlights.length === 0 ? (
        <div className="text-center py-16">
          <Flame className="h-14 w-14 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No highlights ranked yet for {sport === "all" ? "this period" : getSportName(sport)}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlights.map((h, idx) => (
            <Card
              key={h.post_id}
              className="overflow-hidden group border-border/60 hover:border-primary/50 transition-colors"
            >
              <div className="relative aspect-video bg-muted">
                {h.video_url ? (
                  <SecureVideo
                    src={h.video_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                    controls
                    onPlay={() => logPostView(h.post_id)}
                  />
                ) : (
                  <SecureImage
                    src={h.image_url as string}
                    alt={h.content?.slice(0, 80) || "Highlight"}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
                <Badge
                  className={cn(
                    "absolute top-2 left-2 gap-1",
                    idx < 3 ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground"
                  )}
                >
                  #{idx + 1}
                </Badge>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-sm line-clamp-2 min-h-[2.5rem]">{h.content || "Highlight"}</p>

                <button
                  type="button"
                  onClick={() => navigate(`/athlete/${h.user_id}`)}
                  className="flex items-center gap-2 text-left"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={h.avatar_url || undefined} alt={h.username} />
                    <AvatarFallback>{h.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium flex items-center gap-1">
                    {h.full_name || h.username}
                    {h.sports?.[0] && <InlineSportIcon sportId={h.sports[0]} />}
                  </span>
                </button>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {h.views_count}
                  </span>
                  <span className="flex items-center gap-1">👏 {h.applause_count}</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {h.comments_count}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-primary font-medium">
                    <Flame className="h-3.5 w-3.5" /> {Math.round(Number(h.score))}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingBySport;
