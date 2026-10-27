import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackPageView } from "@/lib/analytics";

export default function ThankYou() {
  const { state } = useLocation() as { state?: { name?: string; alreadyApplied?: boolean; token?: string | null } };
  useEffect(() => { trackPageView("/thank-you"); }, []);
  return (
    <main className="min-h-screen bg-background px-5 py-20">
      <div className="max-w-xl mx-auto space-y-6">
        <Link to="/welcome" className="text-2xl font-display font-bold">U<span className="text-secondary">⚡️</span>Sportz</Link>
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h1 className="text-4xl sm:text-5xl">Thank you{state?.name ? `, ${state.name}` : ""}.</h1>
        {state?.alreadyApplied ? (
          <p className="text-muted-foreground leading-relaxed">We already have an application for this email address — no need to apply twice. Every application is reviewed by our team.</p>
        ) : (
          <p className="text-muted-foreground leading-relaxed">Your Founding 100 application has been saved for our team to review. A founding spot is only confirmed once you're approved. Email confirmations are not available yet.</p>
        )}
        <div className="border border-border rounded-lg bg-card p-5 flex items-start gap-3">
          <Zap className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">While you wait, you can create a free account and start exploring U⚡️Sportz today.</p>
        </div>
        {state?.token && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">You also subscribed to the newsletter. Keep this private link to unsubscribe anytime (email delivery is not available yet).</p>
            <Input aria-label="Private unsubscribe link" readOnly value={`${window.location.origin}/unsubscribe#${state.token}`} />
          </div>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild><Link to="/auth?mode=signup">Create your account</Link></Button>
          <Button variant="outline" asChild><Link to="/welcome">Back to home</Link></Button>
        </div>
      </div>
    </main>
  );
}
