import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Zap, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface UpgradeProModalProps {
  open: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    id: "fx_pro_pack_onetime",
    label: "Pro FX Pack",
    price: "$9.99",
    suffix: "one-time",
    hint: "Unlock every premium skin & filter forever",
    icon: Zap,
  },
  {
    id: "fx_pro_monthly",
    label: "Pro FX Membership",
    price: "$4.99",
    suffix: "/mo",
    hint: "All premium FX plus every future drop",
    icon: Repeat,
  },
] as const;

export const UpgradeProModal = ({ open, onClose }: UpgradeProModalProps) => {
  const { user } = useAuth();
  const { hasPack } = usePremium();
  // Owning the one-time pack is permanent access — never upsell the membership to them.
  const plans = hasPack ? PLANS.filter((p) => p.id !== "fx_pro_monthly") : PLANS;
  const [selected, setSelected] = useState<string>(PLANS[0].id);
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
                Your premium FX unlock right after payment.
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
                <Crown className="h-7 w-7 text-primary-foreground" />
              </div>
              <DialogTitle className="text-center text-2xl">Unlock U⚡️Sportz PRO FX</DialogTitle>
              <DialogDescription className="text-center">
                Every premium animation skin, filter and one-tap effect.
              </DialogDescription>
            </DialogHeader>

            <ul className="space-y-2 py-1">
              {[
                "40+ premium character & object skins",
                "Pro animation filters (inferno, neon trails, shadow clone & more)",
                "Exclusive one-tap FX combos",
                "Priority access to new effect drops",
              ].map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            <div className="grid gap-2">
              {plans.map((p) => {
                const Icon = p.icon;
                const active = selected === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors flex items-center gap-3",
                      active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.hint}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{p.price}</span>
                      <span className="text-xs text-muted-foreground">{p.suffix}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button size="lg" className="gap-2" onClick={() => setCheckingOut(true)}>
                <Zap className="h-4 w-4" />
                Continue
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Maybe later
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
