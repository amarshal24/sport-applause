import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncedClipPreviewProps {
  /** Object URL of the clip being posted (optional — audio-only preview without it) */
  videoUrl?: string | null;
  /** Still image fallback for photo posts */
  imageUrl?: string | null;
  audioUrl: string;
  trimStart?: number;
  trimEnd?: number | null;
  fadeIn?: number;
  fadeOut?: number;
  className?: string;
  aspect?: string;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/**
 * Plays the clip and the selected track together, with the music starting at the
 * exact trim start so timing can be verified before posting.
 */
export const SyncedClipPreview = ({
  videoUrl,
  imageUrl,
  audioUrl,
  trimStart = 0,
  trimEnd,
  fadeIn = 0,
  fadeOut = 0,
  className,
  aspect = "4 / 5",
}: SyncedClipPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);

  const musicDuration = Math.max(
    0.1,
    (trimEnd ?? trimStart + 30) - trimStart,
  );

  const stop = useCallback((reset = true) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    videoRef.current?.pause();
    setIsPlaying(false);
    if (reset) {
      setElapsed(0);
      if (videoRef.current) videoRef.current.currentTime = 0;
      if (audioRef.current) audioRef.current.currentTime = trimStart;
    }
  }, [trimStart]);

  // Reset whenever the track or trim window changes
  useEffect(() => {
    stop(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, trimStart, trimEnd, videoUrl]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
  }, []);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const pos = audio.currentTime - trimStart;
    setElapsed(Math.max(0, pos));

    // Fade envelope applied live so the preview sounds like the final post
    let vol = 1;
    if (fadeIn > 0 && pos < fadeIn) vol = Math.max(0, pos / fadeIn);
    if (fadeOut > 0 && pos > musicDuration - fadeOut) {
      vol = Math.min(vol, Math.max(0, (musicDuration - pos) / fadeOut));
    }
    audio.volume = Math.min(1, Math.max(0, vol));

    if (pos >= musicDuration) {
      stop(true);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [trimStart, fadeIn, fadeOut, musicDuration, stop]);

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = trimStart;
    audio.volume = fadeIn > 0 ? 0 : 1;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = videoMuted;
    }
    try {
      // Start both in the same tick so the track lines up with frame 0
      await Promise.all([
        audio.play(),
        videoRef.current ? videoRef.current.play() : Promise.resolve(),
      ]);
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      stop(true);
    }
  };

  const toggle = () => (isPlaying ? stop(false) : play());

  const progress = Math.min(100, (elapsed / musicDuration) * 100);

  return (
    <div className={cn("rounded-lg border border-border bg-card/60 p-3", className)}>
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {(videoUrl || imageUrl) && (
        <div
          className="relative mx-auto mb-3 w-full max-w-[240px] overflow-hidden rounded-md bg-black"
          style={{ aspectRatio: aspect }}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full object-contain"
              playsInline
              muted={videoMuted}
              preload="metadata"
              onEnded={() => stop(false)}
            />
          ) : (
            <img src={imageUrl!} alt="Clip preview" className="h-full w-full object-contain" />
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={toggle} className="gap-1">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "Pause" : "Preview with music"}
        </Button>

        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {fmt(elapsed)} / {fmt(musicDuration)} · music starts at {fmt(trimStart)}
          </p>
        </div>

        <Button size="sm" variant="ghost" onClick={() => stop(true)} title="Restart">
          <RotateCcw className="h-4 w-4" />
        </Button>

        {videoUrl && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setVideoMuted((m) => {
                const next = !m;
                if (videoRef.current) videoRef.current.muted = next;
                return next;
              });
            }}
            title={videoMuted ? "Unmute clip audio" : "Mute clip audio"}
          >
            {videoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SyncedClipPreview;
