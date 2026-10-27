import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, Crown, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { AnimationTutorial } from "@/components/video-fx/AnimationTutorial";
import GameCheckoutReturn from "@/components/games/GameCheckoutReturn";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

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
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");
  useEffect(() => {
    let alive = true;
    setConfirmed(false); setConfirmationError("");
    if (!sessionId || searchParams.get("type") === "creator_game") return;
    let count = 0;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("checkout-status", { body: { sessionId, environment: getStripeEnvironment() } });
        if (!alive) return;
        if (error || data?.error) { setConfirmationError("Payment could not be confirmed. Check your purchases or try again later."); return; }
        if (data?.settled) { setConfirmed(true); return; }
        if (++count < 10) timer = setTimeout(check, 2000);
        else setConfirmationError("Payment is still pending. Access will activate after settlement.");
      } catch { if (alive) setConfirmationError("Payment confirmation is unavailable."); }
    };
    void check();
    return () => { alive = false; clearTimeout(timer); };
  }, [sessionId, searchParams]);
  const { isPremium: hasProFx, skinTier, refresh } = usePremium();
  // Skin pack buyers own a tier without full PRO FX — still a completed purchase.
  const skinOnly = !hasProFx && skinTier !== "free";
  const isPremium = confirmed && (hasProFx || skinOnly);
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

  const podcastType = searchParams.get("type");
  if (podcastType === "creator_game") return <GameCheckoutReturn sessionId={sessionId} />;
  if (podcastType?.startsWith("podcast_")) {
    const kind = podcastType.replace("podcast_", "");
    const title =
      kind === "unlock" ? "Episode unlocked 🎧" : kind === "membership" ? "You're a member 👑" : "Thanks for the tip 💙";
    const body =
      kind === "unlock"
        ? "The episode is ready to play in Podcasts."
        : kind === "membership"
          ? "Your monthly membership is active. You'll see a Member badge on the creator's episodes."
          : "Your tip was sent to the creator.";
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 rounded-xl border border-border bg-card/60 p-8">
          {confirmed ? <CheckCircle2 className="h-12 w-12 text-primary mx-auto" /> : <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />}
          <h1 className="text-2xl font-bold">{confirmed ? title : "Confirming payment"}</h1>
          <p className="text-sm text-muted-foreground">{confirmed ? body : !sessionId ? "No checkout session found." : confirmationError || "Waiting for Stripe to confirm settlement."}</p>
          <div className="flex flex-col gap-2">
            <Button asChild><Link to="/podcasts">Back to Podcasts</Link></Button>
            <Button asChild variant="ghost"><Link to="/">Back home</Link></Button>
          </div>
        </div>
      </main>
    );
  }

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
          {isPremium ? (skinOnly ? "Skin pack unlocked ⚡️" : "PRO FX unlocked ⚡️") : "Finishing up…"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isPremium && skinOnly
            ? "Your new character skins are ready in the Animation Center and Recruiting editor."
            : isPremium
            ? "Every premium effect, filter and animation is now available in the Animation Center and Recruiting editor. Your PRO badge is live on your profile."
            : sessionId
              ? confirmationError || "We're confirming your payment. This usually takes a few seconds."
              : "No checkout session found."}
        </p>
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
