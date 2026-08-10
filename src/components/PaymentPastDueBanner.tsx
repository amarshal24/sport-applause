import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { useState } from "react";

/**
 * Grace-period banner: a failed monthly payment keeps Pro FX unlocked
 * while the card is retried, but nudges the member to fix billing.
 */
export const PaymentPastDueBanner = () => {
  const { isPastDue } = usePremium();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isPastDue) return null;

  const openPortal = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.origin,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Could not open billing");
      window.open(data.url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive-foreground">
      <span className="inline-flex flex-wrap items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Your last Pro FX payment didn't go through. You still have access while we retry —
        update your card to keep it.
        <Button size="sm" variant="outline" onClick={openPortal} disabled={busy || !user}>
          {busy ? "Opening…" : "Update payment"}
        </Button>
      </span>
    </div>
  );
};
