import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play } from "lucide-react";
import { toSignedUrl } from "@/lib/signedMedia";
import { cn } from "@/lib/utils";

interface PostMusicPlayerProps {
  musicUrl: string;
  title?: string | null;
  startTime?: number | null;
  endTime?: number | null;
  fadeIn?: number | null;
  fadeOut?: number | null;
  className?: string;
  compact?: boolean;
}

const BASE_VOLUME = 0.6;

export function PostMusicPlayer({
  musicUrl,
  title,
  startTime,
  endTime,
  fadeIn,
  fadeOut,
  className,
  compact = false,
}: PostMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const start = startTime ?? 0;
  const end = endTime ?? null;
  const fIn = fadeIn ?? 0;
  const fOut = fadeOut ?? 0;

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioRef.current?.pause();
    setPlaying(false);
  };

  const tick = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    let vol = BASE_VOLUME;
    if (fIn > 0 && t - start < fIn) vol = BASE_VOLUME * Math.max(0, (t - start) / fIn);
    if (end && fOut > 0 && end - t < fOut) vol = Math.min(vol, BASE_VOLUME * Math.max(0, (end - t) / fOut));
    audio.volume = Math.min(1, Math.max(0, vol));
    if (end && t >= end) {
      stop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (playing) {
      stop();
      return;
    }
    try {
      setLoading(true);
      if (!audioRef.current) {
        const src = await toSignedUrl(musicUrl);
        if (!src) {
          setLoading(false);
          return;
        }
        const audio = new Audio(src);
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audio.onended = stop;
        audioRef.current = audio;
      }
      const audio = audioRef.current;
      audio.currentTime = start;
      audio.volume = fIn > 0 ? 0 : BASE_VOLUME;
      await audio.play();
      setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause music" : `Play music${title ? `: ${title}` : ""}`}
        className={cn(
          "h-7 w-7 rounded-full bg-background/70 backdrop-blur flex items-center justify-center text-foreground shadow-sm",
          className,
        )}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Music className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-full bg-background/70 backdrop-blur px-3 py-1.5 text-xs text-foreground shadow-sm max-w-full",
        className,
      )}
    >
      {playing ? <Pause className="h-3.5 w-3.5 shrink-0" /> : <Play className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{title || "Play music"}</span>
    </button>
  );
}
