import { useEffect, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
export default function GameCheckoutModal({ game, onClose }: { game: { id: string; title: string } | null; onClose: () => void }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    setSecret(null); setError("");
    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("create-game-checkout", { body: { gameId: game.id, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/checkout/return?type=creator_game&session_id={CHECKOUT_SESSION_ID}` } });
        if (error || !data?.clientSecret) throw Error(data?.error ?? "Could not start game checkout");
        if (!cancelled) setSecret(data.clientSecret);
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Checkout unavailable"); }
    })();
    return () => { cancelled = true; };
  }, [game?.id]);
  return <Dialog open={!!game} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{game?.title} · Test purchase</DialogTitle></DialogHeader>{error ? <p role="alert" className="text-destructive">{error}</p> : secret ? <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret: secret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider> : <Loader2 className="animate-spin text-primary" aria-label="Loading checkout" />}</DialogContent></Dialog>;
}