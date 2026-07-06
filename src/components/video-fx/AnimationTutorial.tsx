import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Sparkles,
  Wand2,
  Type,
  Music,
  Scissors,
  Play,
  Send,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TUTORIAL_KEY = "animation-center-tutorial-seen-v1";
const TUTORIAL_STEP_KEY = "animation-center-tutorial-step-v1";

function readSavedStep(max: number): number {
  try {
    const raw = localStorage.getItem(TUTORIAL_STEP_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0 && n < max) return n;
  } catch {}
  return 0;
}

function saveStep(step: number) {
  try {
    localStorage.setItem(TUTORIAL_STEP_KEY, String(step));
  } catch {}
}

function clearSavedStep() {
  try {
    localStorage.removeItem(TUTORIAL_STEP_KEY);
  } catch {}
}

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    icon: Upload,
    title: "1. Upload your clip",
    body: "Tap Upload Video to drop in a highlight (up to 50MB). You can also open a video straight from your Top 5 highlights.",
  },
  {
    icon: Sparkles,
    title: "2. Pick a filter",
    body: "Choose from Vintage, Neon, Cinematic, Dreamy and more. The preview updates live — no rendering wait.",
  },
  {
    icon: Wand2,
    title: "3. Add character animations",
    body: "Tap Filters & FX → Character Transforms. Drop pins on people or objects (up to 6) and swap them into skins like ninja, hero, fire hoop, comet trail and more.",
  },
  {
    icon: Type,
    title: "4. Text, stickers & transforms",
    body: "Type captions with animated fonts, drop sports emojis, or flip, rotate and adjust brightness / contrast / saturation.",
  },
  {
    icon: Scissors,
    title: "5. Trim to the best moment",
    body: "Set in and out points so only the highlight makes the cut. Add intro & outro transitions like fade, zoom, or glitch.",
  },
  {
    icon: Music,
    title: "6. Add music",
    body: "Pick from the royalty-free library (Hype, Chill, Cinematic, Trap…) and balance the volume with your original audio.",
  },
  {
    icon: Play,
    title: "7. Preview everything together",
    body: "Tap Preview to watch filters, FX, text and music play in sync before you commit.",
  },
  {
    icon: Send,
    title: "8. Post to your feed",
    body: "Happy with it? Tap Post to publish straight to U⚡️Sportz. You can also Save the file to your device.",
  },
];

interface AnimationTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnimationTutorial({ open, onOpenChange }: AnimationTutorialProps) {
  const [step, setStepState] = useState(0);

  const setStep = (updater: number | ((s: number) => number)) => {
    setStepState((prev) => {
      const next = typeof updater === "function" ? (updater as (s: number) => number)(prev) : updater;
      saveStep(next);
      return next;
    });
  };

  useEffect(() => {
    if (open) setStepState(readSavedStep(steps.length));
  }, [open]);

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="w-5 h-5 text-primary" />
            Animation Center Tutorial
          </DialogTitle>
          <DialogDescription>
            A quick tour — {step + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-base">{current.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                localStorage.setItem(TUTORIAL_KEY, "1");
              } catch {}
              onOpenChange(false);
            }}
          >
            Skip
          </Button>

          {isLast ? (
            <Button
              size="sm"
              onClick={() => {
                try {
                  localStorage.setItem(TUTORIAL_KEY, "1");
                } catch {}
                onOpenChange(false);
              }}
            >
              Let's create
              <Sparkles className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useAnimationTutorialAutoOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) {
        setOpen(true);
      }
    } catch {}
  }, []);
  return [open, setOpen] as const;
}
