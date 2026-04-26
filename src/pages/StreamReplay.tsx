import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Captions,
  CaptionsOff,
  Flag,
  Trash2,
  ArrowLeft,
  Maximize,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Stream {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  replay_url: string | null;
  caption_vtt_url: string | null;
  thumbnail_url: string | null;
  ended_at: string | null;
  started_at: string | null;
  viewers_count: number;
}

interface Highlight {
  id: string;
  user_id: string;
  label: string;
  timestamp_seconds: number;
  created_at: string;
}

interface StreamerProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const StreamReplay = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [stream, setStream] = useState<Stream | null>(null);
  const [profile, setProfile] = useState<StreamerProfile | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);

  // Highlight composer
  const [newHighlightLabel, setNewHighlightLabel] = useState("");
  const [savingHighlight, setSavingHighlight] = useState(false);

  // ----- Data load -----
  useEffect(() => {
    if (!streamId) return;
    let active = true;

    const load = async () => {
      setLoading(true);

      const { data: streamData, error: streamErr } = await supabase
        .from("live_streams")
        .select("*")
        .eq("id", streamId)
        .maybeSingle();

      if (streamErr || !streamData) {
        toast.error("Replay not found");
        navigate("/live");
        return;
      }
      if (!active) return;

      setStream(streamData as Stream);

      const [{ data: profileData }, { data: hlData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", streamData.user_id)
          .maybeSingle(),
        supabase
          .from("stream_highlights")
          .select("*")
          .eq("stream_id", streamId)
          .order("timestamp_seconds", { ascending: true }),
      ]);

      if (!active) return;
      setProfile(profileData as StreamerProfile | null);
      setHighlights((hlData as Highlight[]) ?? []);
      setLoading(false);
    };

    load();

    // Realtime highlight updates
    const channel = supabase
      .channel(`stream_highlights_${streamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stream_highlights", filter: `stream_id=eq.${streamId}` },
        () => {
          supabase
            .from("stream_highlights")
            .select("*")
            .eq("stream_id", streamId)
            .order("timestamp_seconds", { ascending: true })
            .then(({ data }) => setHighlights((data as Highlight[]) ?? []));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [streamId, navigate]);

  // ----- Video event wiring -----
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [stream?.replay_url]);

  // Toggle text track visibility when captionsOn flips
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    Array.from(v.textTracks).forEach((t) => {
      t.mode = captionsOn ? "showing" : "hidden";
    });
  }, [captionsOn, stream?.caption_vtt_url]);

  // ----- Controls -----
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const seekTo = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(seconds, duration || seconds));
  };

  const skip = (delta: number) => seekTo(currentTime + delta);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      v.requestFullscreen?.();
    }
  };

  const handleVolumeChange = (vals: number[]) => {
    const v = videoRef.current;
    if (!v) return;
    const nv = vals[0] / 100;
    v.volume = nv;
    setVolume(nv);
    if (nv > 0 && v.muted) {
      v.muted = false;
      setMuted(false);
    }
  };

  // ----- Highlights -----
  const addHighlight = async () => {
    if (!user) {
      toast.error("Sign in to add highlights");
      return;
    }
    if (!stream || !newHighlightLabel.trim()) return;
    setSavingHighlight(true);
    const { error } = await supabase.from("stream_highlights").insert({
      stream_id: stream.id,
      user_id: user.id,
      label: newHighlightLabel.trim().slice(0, 80),
      timestamp_seconds: currentTime,
    });
    if (error) {
      toast.error("Failed to save highlight");
    } else {
      toast.success("Highlight added");
      setNewHighlightLabel("");
    }
    setSavingHighlight(false);
  };

  const deleteHighlight = async (id: string) => {
    const { error } = await supabase.from("stream_highlights").delete().eq("id", id);
    if (error) toast.error("Couldn't delete highlight");
    else toast.success("Highlight removed");
  };

  const progressPct = useMemo(
    () => (duration > 0 ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  );

  // ----- Render -----
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-24 px-4 lg:pl-64 lg:px-6 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-40 mb-4" />
          <Skeleton className="aspect-video w-full mb-4" />
          <Skeleton className="h-24 w-full" />
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!stream) return null;

  const replayAvailable = !!stream.replay_url;
  const hasEnded = stream.status === "ended";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-24 px-4 lg:pl-64 lg:px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/live")} className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to live
          </Button>

          {/* Player */}
          <div className="relative overflow-hidden rounded-xl bg-black aspect-video">
            {replayAvailable ? (
              <>
                <video
                  ref={videoRef}
                  src={stream.replay_url ?? undefined}
                  poster={stream.thumbnail_url ?? undefined}
                  className="h-full w-full object-contain"
                  onClick={togglePlay}
                  playsInline
                  crossOrigin="anonymous"
                >
                  {stream.caption_vtt_url && (
                    <track
                      kind="captions"
                      src={stream.caption_vtt_url}
                      srcLang="en"
                      label="English"
                      default
                    />
                  )}
                </video>

                {/* Big play button overlay */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-background/70 backdrop-blur flex items-center justify-center hover:bg-background/90 transition-colors"
                    aria-label="Play replay"
                  >
                    <Play className="h-10 w-10 text-primary fill-primary" />
                  </button>
                )}

                {/* Status badge */}
                <Badge variant="secondary" className="absolute top-3 left-3 gap-1">
                  REPLAY
                </Badge>
              </>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 gap-2">
                <Badge variant="outline">{hasEnded ? "Replay processing" : "Stream not ended yet"}</Badge>
                <p className="text-muted-foreground text-sm max-w-md">
                  {hasEnded
                    ? "The replay for this stream isn't available yet. Check back shortly."
                    : "This stream hasn't ended yet. Replays appear here once the broadcast finishes."}
                </p>
                <Button variant="outline" asChild>
                  <Link to="/live">View live streams</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Custom controls */}
          {replayAvailable && (
            <Card className="p-3 space-y-3">
              {/* Scrub bar with highlight markers */}
              <div className="relative pt-2">
                <Slider
                  value={[progressPct]}
                  min={0}
                  max={100}
                  step={0.1}
                  onValueChange={(v) => seekTo((v[0] / 100) * duration)}
                  aria-label="Scrub"
                />
                {/* Highlight markers */}
                <div className="pointer-events-none absolute inset-x-0 top-1.5 h-2">
                  {duration > 0 &&
                    highlights.map((h) => {
                      const pct = (h.timestamp_seconds / duration) * 100;
                      if (pct < 0 || pct > 100) return null;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          title={`${h.label} • ${formatTime(h.timestamp_seconds)}`}
                          onClick={() => seekTo(h.timestamp_seconds)}
                          className="pointer-events-auto absolute -top-1 -translate-x-1/2 h-4 w-1.5 rounded-full bg-primary shadow-glow hover:scale-110 transition-transform"
                          style={{ left: `${pct}%` }}
                        />
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button size="icon" variant="ghost" onClick={() => skip(-10)} aria-label="Back 10s">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="default" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => skip(10)} aria-label="Forward 10s">
                  <SkipForward className="h-4 w-4" />
                </Button>

                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCaptionsOn((v) => !v)}
                    aria-label="Toggle captions"
                    disabled={!stream.caption_vtt_url}
                    className={cn(!stream.caption_vtt_url && "opacity-40")}
                  >
                    {captionsOn && stream.caption_vtt_url ? (
                      <Captions className="h-4 w-4" />
                    ) : (
                      <CaptionsOff className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <Button size="icon" variant="ghost" onClick={toggleMute} aria-label="Mute">
                      {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[muted ? 0 : volume * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      aria-label="Volume"
                    />
                  </div>

                  <Button size="icon" variant="ghost" onClick={toggleFullscreen} aria-label="Fullscreen">
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Title / streamer */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback>{(profile?.username ?? "S")[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight line-clamp-2">{stream.title}</h1>
              <p className="text-sm text-muted-foreground">
                @{profile?.username ?? "athlete"} ·{" "}
                {stream.ended_at
                  ? `Ended ${format(new Date(stream.ended_at), "PPp")}`
                  : stream.started_at
                  ? `Started ${format(new Date(stream.started_at), "PPp")}`
                  : "—"}
              </p>
              {stream.description && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{stream.description}</p>
              )}
            </div>
          </div>

          {/* Highlights panel */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Highlights</h2>
              <Badge variant="outline" className="ml-auto">
                {highlights.length}
              </Badge>
            </div>

            {replayAvailable && user && (
              <div className="flex gap-2">
                <Input
                  placeholder={`Add highlight at ${formatTime(currentTime)}…`}
                  value={newHighlightLabel}
                  onChange={(e) => setNewHighlightLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addHighlight();
                  }}
                  maxLength={80}
                />
                <Button
                  onClick={addHighlight}
                  disabled={savingHighlight || !newHighlightLabel.trim()}
                >
                  Add
                </Button>
              </div>
            )}

            {highlights.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No highlights yet. {user ? "Add the first one above." : "Sign in to mark moments."}
              </p>
            ) : (
              <ul className="divide-y divide-border/60 -mx-2">
                {highlights.map((h) => {
                  const canDelete =
                    user && (user.id === h.user_id || user.id === stream.user_id);
                  return (
                    <li
                      key={h.id}
                      className="flex items-center gap-2 px-2 py-2 hover:bg-muted/40 rounded-md cursor-pointer group"
                      onClick={() => seekTo(h.timestamp_seconds)}
                    >
                      <Badge variant="secondary" className="tabular-nums shrink-0">
                        {formatTime(h.timestamp_seconds)}
                      </Badge>
                      <span className="text-sm line-clamp-1 flex-1">{h.label}</span>
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHighlight(h.id);
                          }}
                          aria-label="Delete highlight"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default StreamReplay;
