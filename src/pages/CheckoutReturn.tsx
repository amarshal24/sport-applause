import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, Crown, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { AnimationTutorial } from "@/components/video-fx/AnimationTutorial";

/** Lightweight confetti burst — no extra dependency. */
const Confetti = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 1.6,
        rotate: Math.random() * 360,
        hue: [
          "bg-primary",
          "bg-accent",
          "bg-secondary",
          "bg-primary/70",
          "bg-accent/70",
        ][i % 5],
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute top-[-10%] h-2 w-2 rounded-[2px] ${p.hue}`}
          style={{
            left: `${p.left}%`,
            transform: `rotate(${p.rotate}deg)`,
            animation: `fx-confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fx-confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { isPremium, refresh } = usePremium();
  const [tries, setTries] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (isPremium || tries > 8) return;
    const t = setTimeout(() => {
      refresh();
      setTries((n) => n + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [isPremium, tries, refresh]);

  // Celebrate once, then invite them straight into the Pro FX tutorial.
  useEffect(() => {
    if (!isPremium || celebrated) return;
    setCelebrated(true);
    const t = setTimeout(() => setTutorialOpen(true), 1600);
    return () => clearTimeout(t);
  }, [isPremium, celebrated]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      {isPremium && celebrated && <Confetti />}
      <div className="relative max-w-md w-full text-center space-y-4 rounded-xl border border-border bg-card/60 p-8">
        {isPremium ? (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
            <Crown className="h-7 w-7 text-primary-foreground" />
          </div>
        ) : (
          <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
        )}
        <h1 className="text-2xl font-bold">
          {isPremium ? "PRO FX unlocked ⚡️" : "Finishing up…"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isPremium
            ? "Every premium skin, filter and one-tap effect is now available in the Animation Center and Recruiting editor. Your PRO badge is live on your profile."
            : sessionId
              ? "We're confirming your payment. This usually takes a few seconds."
              : "No checkout session found."}
        </p>
        {isPremium && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            A confirmation email is on its way.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {isPremium && (
            <Button variant="secondary" className="gap-2" onClick={() => setTutorialOpen(true)}>
              <PlayCircle className="h-4 w-4" />
              Show me how to use PRO FX
            </Button>
          )}
          <Button asChild>
            <Link to="/animation-center">Open Animation Center</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
      <AnimationTutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </main>
  );
};

export default CheckoutReturn;
