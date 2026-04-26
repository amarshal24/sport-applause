import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Zap } from "lucide-react";

interface UpgradeProModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const UpgradeProModal = ({ open, onClose, onUpgrade }: UpgradeProModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
            <Crown className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-2xl">Unlock U⚡️Sportz PRO</DialogTitle>
          <DialogDescription className="text-center">
            Get every premium filter, sport animation and character transform.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2">
          {[
            "All premium sport animations across 8 sports",
            "12 character transforms (anime, cartoon, hero, athlete)",
            "Priority access to new effects & filters",
            "Cancel anytime",
          ].map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
          <div className="text-3xl font-bold">$4.99<span className="text-base font-normal text-muted-foreground">/mo</span></div>
          <p className="text-xs text-muted-foreground">Billed monthly · cancel anytime</p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onUpgrade ?? onClose} size="lg" className="gap-2">
            <Zap className="h-4 w-4" />
            Upgrade to PRO
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
