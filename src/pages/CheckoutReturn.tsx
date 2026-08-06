import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { isPremium, refresh } = usePremium();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (isPremium || tries > 8) return;
    const t = setTimeout(() => {
      refresh();
      setTries((n) => n + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [isPremium, tries, refresh]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4 rounded-xl border border-border bg-card/60 p-8">
        {isPremium ? (
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
        ) : (
          <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
        )}
        <h1 className="text-2xl font-bold">
          {isPremium ? "PRO FX unlocked" : "Finishing up…"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isPremium
            ? "Every premium skin, filter and one-tap effect is now available in the Animation Center and Recruiting editor."
            : sessionId
              ? "We're confirming your payment. This usually takes a few seconds."
              : "No checkout session found."}
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link to="/animation-center">Open Animation Center</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default CheckoutReturn;
