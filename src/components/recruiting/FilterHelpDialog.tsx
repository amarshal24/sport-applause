import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import tutorialVideo from "@/assets/videos/recruiting-editing-tutorial.mp4.asset.json";

interface FilterHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterHelpDialog({ open, onOpenChange }: FilterHelpDialogProps) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-4xl max-h-[85dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 text-xl sm:text-2xl">
            <Sparkles className="w-6 h-6 shrink-0 text-primary" />
            How to add filters & animations
          </DialogTitle>
          <DialogDescription>
            Video tutorial · 12 minutes · Illustrated editing walkthrough
          </DialogDescription>
        </DialogHeader>

        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {open && !failed && (
            <video
              key={attempt}
              src={tutorialVideo.url}
              controls
              playsInline
              preload="metadata"
              aria-label="Filters and animations video tutorial"
              className="h-full w-full object-contain"
              onError={() => setFailed(true)}
            />
          )}
          {failed && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center" role="alert">
              <p className="text-sm text-muted-foreground">The video couldn’t load.</p>
              <Button variant="outline" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>
                <RotateCcw className="mr-2 h-4 w-4" /> Retry video
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
