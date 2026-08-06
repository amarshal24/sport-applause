import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Volume2, VolumeX, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toSignedUrl } from "@/lib/signedMedia";
import { useDeafAccessibility } from "@/hooks/useDeafAccessibility";

interface FullScreenVideoModalProps {
  src: string;
  open: boolean;
  onClose: () => void;
  caption?: string;
}

const formatTime = (s: number) => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const FullScreenVideoModal = ({ src, open, onClose, caption }: FullScreenVideoModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { preferCaptions } = useDeafAccessibility();

  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  // CONTAIN = show full video (default), COVER = fill screen (may crop)
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");

  useEffect(() => {
    let alive = true;
    if (!open || !src) {
      setResolvedSrc(undefined);
      return;
    }
    toSignedUrl(src).then((u) => {
      if (alive) setResolvedSrc(u || src);
    });
    return () => { alive = false; };
  }, [src, open]);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  // Lock body scroll & ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    scheduleHide();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset state when opened / src changes — always start in contain (no crop)
  useEffect(() => {
    if (!open) return;
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    setFitMode("contain");
  }, [src, open]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
    revealControls();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    revealControls();
  };

  const toggleFit = () => {
    setFitMode((m) => (m === "contain" ? "cover" : "contain"));
    revealControls();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
    revealControls();
  };

  if (!open) return null;

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      {resolvedSrc ? (
        <video
          ref={videoRef}
          src={resolvedSrc}
          autoPlay
          playsInline
          muted={isMuted}
          className={cn(
            "w-full h-full bg-black cursor-pointer",
            fitMode === "contain" ? "object-contain" : "object-cover"
          )}
          onClick={togglePlay}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      ) : (
        <div className="w-full h-full bg-black" />
      )}

      {/* Top bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20 rounded-full h-10 w-10"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20 rounded-full h-10 w-10"
          onClick={toggleFit}
          aria-label={fitMode === "contain" ? "Fill screen" : "Fit video"}
          title={fitMode === "contain" ? "Fill screen (may crop)" : "Fit (show full video)"}
        >
          {fitMode === "contain" ? (
            <Maximize2 className="h-5 w-5" />
          ) : (
            <Minimize2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Center play/pause indicator (only when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <div className="h-20 w-20 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="h-10 w-10 text-white ml-1" />
          </div>
        </button>
      )}

      {/* Caption overlay for deaf accessibility */}
      {preferCaptions && caption && (
        <div
          className="absolute left-4 right-4 bottom-24 z-[101] pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto max-w-2xl rounded-md bg-black/90 border border-white/40 px-4 py-2.5 max-h-32 overflow-y-auto pointer-events-auto">
            <p className="text-base font-medium text-white text-center leading-snug whitespace-pre-wrap">
              {caption}
            </p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-3 group"
        >
          <div
            className="h-full bg-primary rounded-full relative"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 rounded-full h-10 w-10"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 rounded-full h-10 w-10"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>

          <span className="text-white text-sm font-mono ml-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FullScreenVideoModal;
