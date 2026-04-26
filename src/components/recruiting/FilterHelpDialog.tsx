import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Wand2, Music, Scissors, Repeat2 } from "lucide-react";

interface FilterHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    icon: Scissors,
    title: "1. Open the editor",
    body: "Tap the ✨ Edit / Filters button on any of your highlight reels. The full-screen editor opens with your video.",
  },
  {
    icon: Sparkles,
    title: "2. Pick a filter",
    body: "Tap Filters in the side toolbar to choose Vintage, Cool, Warm, Vivid, Noir, Neon, Dreamy and more. The preview updates live.",
  },
  {
    icon: Wand2,
    title: "3. Add custom animations",
    body: "Tap FX+ to open Sport Animations and Character Transforms. Free and PRO effects are clearly badged. Drop up to 2 character pins on the video.",
  },
  {
    icon: Music,
    title: "4. Trim & add music",
    body: "Use Trim to set in/out points, then add background music from the library or upload your own with fade in/out.",
  },
  {
    icon: Repeat2,
    title: "5. Preview & repost",
    body: "Press Play to preview everything together. When you're happy, tap Repost to Feed to publish your edited reel to the main feed.",
  },
];

export function FilterHelpDialog({ open, onOpenChange }: FilterHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            How to add filters & animations
          </DialogTitle>
          <DialogDescription>
            Polish your highlight reel in seconds — then share it with recruiters and your feed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">{title}</h4>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Tip: PRO effects show a PRO badge. Free effects are always available.
        </p>
      </DialogContent>
    </Dialog>
  );
}
