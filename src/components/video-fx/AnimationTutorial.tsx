import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import tutorialVideo from "@/assets/animation-center-tutorial.mp4.asset.json";

const TUTORIAL_KEY = "animation-center-tutorial-seen-v1";
const TUTORIAL_PROGRESS_KEY = "animation-center-tutorial-progress-v1";

function readSavedTime(): number {
  try {
    const raw = localStorage.getItem(TUTORIAL_PROGRESS_KEY);
    if (!raw) return 0;
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  } catch {}
  return 0;
}

function saveTime(t: number) {
  try {
    localStorage.setItem(TUTORIAL_PROGRESS_KEY, String(t));
  } catch {}
}

function clearSavedTime() {
  try {
    localStorage.removeItem(TUTORIAL_PROGRESS_KEY);
  } catch {}
}

const chapters = [
  { t: 0.0, label: "Upload your clip" },
  { t: 1.6, label: "Pick a filter" },
  { t: 3.2, label: "Character transforms" },
  { t: 5.0, label: "Text, stickers & FX" },
  { t: 6.6, label: "Trim to the highlight" },
  { t: 8.2, label: "Preview & post" },
];

interface AnimationTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnimationTutorial({ open, onOpenChange }: AnimationTutorialProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  // Resume from saved time on open
  useEffect(() => {
    if (!open) return;
    const v = videoRef.current;
    if (!v) return;
    const saved = readSavedTime();
    const apply = () => {
      try {
        if (saved > 0 && saved < (v.duration || Infinity) - 0.25) {
          v.currentTime = saved;
        }
      } catch {}
    };
    if (v.readyState >= 1) apply();
    else v.addEventListener("loadedmetadata", apply, { once: true });
  }, [open]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    saveTime(v.currentTime);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const restart = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    saveTime(0);
    v.play().then(() => setPlaying(true)).catch(() => {});
  };

  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    saveTime(t);
  };

  const finish = (markSeen: boolean) => {
    if (markSeen) {
      try {
        localStorage.setItem(TUTORIAL_KEY, "1");
      } catch {}
      clearSavedTime();
    }
    onOpenChange(false);
  };

  const activeChapter = (() => {
    let idx = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (current >= chapters[i].t) idx = i;
    }
    return idx;
  })();

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          // Pause on close so audio/video doesn't linger
          videoRef.current?.pause();
          setPlaying(false);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md p-0 animate-scale-in max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="w-5 h-5 text-primary" />
            Animation Center — Video Tutorial
          </DialogTitle>
          <DialogDescription>
            Watch how to edit and create animation videos in under a minute.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-3 bg-black overflow-hidden">
          <video
            ref={videoRef}
            src={tutorialVideo.url}
            className="w-full aspect-[9/16] max-h-[40vh] object-contain bg-black"
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              clearSavedTime();
            }}
          />

          {/* Chapter label overlay — smooth crossfade per chapter */}
          <div className="absolute top-2 left-2 right-2 flex justify-center pointer-events-none">
            <div
              key={activeChapter}
              className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/10 animate-fade-in shadow-lg"
            >
              {activeChapter + 1}. {chapters[activeChapter].label}
            </div>
          </div>

          {/* Play/pause tap target */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div
              className={`w-16 h-16 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-all duration-300 ease-out ${
                playing
                  ? "opacity-0 scale-75 pointer-events-none"
                  : "opacity-100 scale-100 group-hover:scale-110 animate-scale-in"
              }`}
            >
              <Play className="w-7 h-7 ml-1" fill="currentColor" />
            </div>
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-[width] duration-200 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Chapters */}
        <div className="px-5 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {chapters.map((c, i) => (
              <button
                key={c.t}
                onClick={() => seekTo(c.t)}
                className={`text-[11px] px-2 py-1 rounded-full border transition-all duration-300 ease-out ${
                  i === activeChapter
                    ? "bg-primary text-primary-foreground border-primary scale-105 shadow-sm"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:scale-105"
                }`}
              >
                {i + 1}. {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <Button variant="ghost" size="sm" onClick={restart} className="transition-transform hover:scale-105">
            <RotateCcw className="w-4 h-4 mr-1" />
            Restart
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => finish(true)}>
              Skip
            </Button>
            <Button size="sm" onClick={togglePlay} className="transition-transform hover:scale-105">
              {playing ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" fill="currentColor" />
                  {current > 0 ? "Resume" : "Play"}
                </>
              )}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => finish(true)} className="transition-transform hover:scale-105">
              Let's create
              <Sparkles className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { useAnimationTutorialAutoOpen } from "./useAnimationTutorial";

