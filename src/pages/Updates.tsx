import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Megaphone, Rocket, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicSubscriptionForm from "@/components/PublicSubscriptionForm";
import { useAuth } from "@/hooks/useAuth";
import { trackPageView } from "@/lib/analytics";

const channels = [
  { icon: Sparkles, title: "Feature updates", text: "New tools for athletes, creators and fans — as they ship." },
  { icon: Users, title: "Creator spotlights", text: "The people making U⚡️Sportz worth watching." },
  { icon: Rocket, title: "Beta announcements", text: "Be first to know when beta testing opens." },
  { icon: Megaphone, title: "Launch news", text: "Milestones on the road to public launch." },
];

export default function Updates() {
  const { user } = useAuth();
  useEffect(() => { trackPageView("/updates"); }, []);
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b border-border bg-background">
        <nav aria-label="Updates navigation" className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link to="/welcome" className="font-display text-2xl font-bold whitespace-nowrap">U<span className="text-secondary">⚡️</span>Sportz</Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <Link to="/founding100" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground">Founding 100</Link>
            <Button variant="ghost" size="sm" asChild><Link to={user ? "/" : "/auth"}>{user ? "Open app" : "Sign in"}<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </nav>
      </header>
      <main>
        <section className="max-w-5xl mx-auto px-5 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase mb-5 flex items-center gap-2"><Zap className="h-4 w-4 text-secondary" /> Updates</p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-none">Never miss<br />a moment.</h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed">Feature releases, creator spotlights, beta announcements and launch news — sent only to people who ask for them.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
            {channels.map(({ icon: Icon, ...c }) => (
              <div key={c.title} className="border-t border-border pt-6">
                <Icon className="h-6 w-6 text-primary mb-4" />
                <h2 className="text-xl">{c.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-border bg-card">
          <div className="max-w-5xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-10">
            <div>
              <p className="text-secondary uppercase text-xs font-semibold mb-4">Subscribe</p>
              <h2 className="text-4xl">Your sports.<br />Your updates.</h2>
              <p className="text-muted-foreground mt-5 leading-relaxed">You choose exactly what we send you — newsletters, event announcements, or both. Your consent is recorded separately for each, and you can unsubscribe anytime.</p>
            </div>
            <PublicSubscriptionForm />
          </div>
        </section>
      </main>
      <footer className="border-t border-border"><div className="max-w-5xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-5"><span className="text-sm text-muted-foreground">© {new Date().getFullYear()} U⚡️Sportz</span><div className="flex flex-wrap gap-5 text-sm text-muted-foreground"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/unsubscribe">Unsubscribe</Link></div></div></footer>
    </div>
  );
}
