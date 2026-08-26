import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { sampleTrack, type TrackPoint } from "@/lib/objectTracker";
import { cn } from "@/lib/utils";

interface TrackedPreviewProps {
  /** Clip being edited. */
  source?: File | Blob | string | null;
  /** Tracked path, when the object is already locked on. */
  track?: TrackPoint[];
  /** Fallback position (percent) when there is no track yet. */
  x: number;
  y: number;
  skinEmoji: string;
  animationEmoji?: string;
  label?: string;
  className?: string;
}

/**
 * Small scrubbable preview that shows the chosen skin + animation riding the
 * tracked frames of one object, before it gets added/committed.
 */
export const TrackedPreview = ({
  source,
  track,
  x,
  y,
  skinEmoji,
  animationEmoji,
  label,
  className,
}: TrackedPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(track?.[0]?.t ?? 0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!source) {
      setUrl(null);
      return;
    }
    if (typeof source === "string") {
      setUrl(source);
      return;
    }
    const objectUrl = URL.createObjectURL(source);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [source]);

  // Keep the scrub head in sync while playing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => {
      const v = videoRef.current;
      if (v) setTime(v.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const pos = useMemo(() => {
    const p = sampleTrack(track, time);
    return { x: p?.x ?? x, y: p?.y ?? y, c: p?.c ?? null };
  }, [track, time, x, y]);

  const seek = (t: number) => {
    setTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  if (!url) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Load a clip to preview this effect.
      </p>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative w-full overflow-hidden rounded-md bg-black aspect-video">
        <video
          ref={videoRef}
          src={url}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(v.duration || 0);
            v.currentTime = track?.[0]?.t ?? 0;
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        <div
          className="absolute pointer-events-none"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
        >
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/50 blur-xl animate-pulse" />
          </div>
          <span className="text-2xl drop-shadow-lg">{skinEmoji}</span>
          {animationEmoji && animationEmoji !== "—" && (
            <span className="absolute -top-3 -right-3 text-base animate-pulse">
              {animationEmoji}
            </span>
          )}
        </div>
        {label && (
          <span className="absolute bottom-1 left-1 rounded bg-background/70 px-1.5 py-0.5 text-[10px]">
            {label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-7 w-7 p-0"
          onClick={toggle}
          aria-label={playing ? "Pause preview" : "Play preview"}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Slider
          value={[Math.min(time, duration || time)]}
          min={0}
          max={duration || 0.001}
          step={0.05}
          onValueChange={([t]) => seek(t)}
          className="flex-1"
          aria-label="Scrub preview"
        />
        <span className="text-[10px] tabular-nums text-muted-foreground w-16 text-right">
          {time.toFixed(1)}s
          {pos.c !== null ? ` · ${Math.round(pos.c * 100)}%` : ""}
        </span>
      </div>
    </div>
  );
};
