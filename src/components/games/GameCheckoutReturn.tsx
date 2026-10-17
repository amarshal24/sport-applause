import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
export default function GameCheckoutReturn({ sessionId }: { sessionId: string | null }) {
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!sessionId) { setError("No checkout session found."); return; }
    let active = true, attempts = 0;
    const check = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("reconcile-game-checkout", { body: { sessionId, environment: getStripeEnvironment() } });
        if (!active) return;
        if (error) throw Error("Payment confirmation is unavailable. Your order is saved in Purchased games.");
        setStatus(data.status);
        if (data.status === "pending" && ++attempts < 10) timer = window.setTimeout(check, 1500);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Confirmation unavailable"); }
    };
    let timer = 0; void check();
    return () => { active = false; window.clearTimeout(timer); };
  }, [sessionId]);
  return <main className="min-h-screen flex items-center justify-center p-6"><div className="max-w-md text-center space-y-4"><h1 className="text-2xl font-bold">{status === "paid" ? "Game purchased" : status === "refunded" ? "Game refunded" : status === "failed" ? "Payment failed" : "Confirming game payment"}</h1><p className="text-muted-foreground" role="status">{error || (status === "paid" ? "Your test purchase is saved in Purchased games." : "Access is granted only after payment is confirmed.")}</p><Button asChild><Link to="/games">Back to Games</Link></Button></div></main>;
}