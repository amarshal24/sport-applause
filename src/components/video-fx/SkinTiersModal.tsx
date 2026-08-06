import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Shirt, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { SKIN_TIERS, SKIN_TIER_RANK } from "@/constants/skinTiers";

interface SkinTiersModalProps {
  open: boolean;
  onClose: () => void;
}

export const SkinTiersModal = ({ open, onClose }: SkinTiersModalProps) => {
  const { user } = useAuth();
  const { skinTier } = usePremium();
  // Only offer tiers above what the user already owns.
  const tiers = SKIN_TIERS.filter(
    (t) => SKIN_TIER_RANK[t.tier] > SKIN_TIER_RANK[skinTier],
  );
  const [selected, setSelected] = useState<string>(
    tiers[tiers.length - 1]?.priceId ?? SKIN_TIERS[0].priceId,
  );
  const [checkingOut, setCheckingOut] = useState(false);

  const handleClose = () => {
    setCheckingOut(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {checkingOut ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Complete your purchase</DialogTitle>
              <DialogDescription className="text-center">
                Your skins unlock right after payment.
              </DialogDescription>
            </DialogHeader>
            <PaymentTestModeBanner />
            <StripeEmbeddedCheckout
              priceId={selected}
              userId={user?.id}
              customerEmail={user?.email ?? undefined}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            />
            <Button variant="ghost" size="sm" onClick={() => setCheckingOut(false)}>
              Back
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
                <Shirt className="h-7 w-7 text-primary-foreground" />
              </div>
              <DialogTitle className="text-center text-2xl">Skin Swap Packs</DialogTitle>
              <DialogDescription className="text-center">
                Swap any player or object in your clip into a new skin.
              </DialogDescription>
            </DialogHeader>

            {tiers.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <Sparkles className="mx-auto h-8 w-8 text-primary" />
                <p className="text-sm">You already own every skin pack. Go create something wild.</p>
                <Button onClick={handleClose}>Close</Button>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  {tiers.map((t) => {
                    const active = selected === t.priceId;
                    return (
                      <button
                        key={t.priceId}
                        type="button"
                        onClick={() => setSelected(t.priceId)}
                        className={cn(
                          "w-full rounded-lg border p-3 text-left transition-colors flex items-center gap-3",
                          active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-5 w-5 shrink-0",
                            active ? "text-primary" : "text-muted-foreground/40",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{t.hint}</p>
                        </div>
                        <span className="text-lg font-bold">{t.price}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  One-time purchase. Each tier includes everything below it.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <Button size="lg" className="gap-2" onClick={() => setCheckingOut(true)}>
                    <Shirt className="h-4 w-4" />
                    Continue
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    Maybe later
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
