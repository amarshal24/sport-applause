import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, FlaskConical, MessageSquareHeart, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Founding100Form from "@/components/Founding100Form";
import Founding100Counter from "@/components/Founding100Counter";
import { useAuth } from "@/hooks/useAuth";
import { trackPageView } from "@/lib/analytics";

const perks = [
  { icon: BadgeCheck, title: "Founding member badge", text: "A permanent badge on your profile that says you were here first." },
  { icon: FlaskConical, title: "Priority beta consideration", text: "Founding 100 applicants are first in line when beta testing opens." },
  { icon: Star, title: "Exclusive early membership", text: "A founding circle of 100 people — athletes, coaches, creators, podcasters and fans." },
  { icon: MessageSquareHeart, title: "Your feedback shapes the app", text: "A direct line to the team building U⚡️Sportz. Tell us what to build next." },
];

export default function Founding100() {
  const { user } = useAuth();
  useEffect(() => { trackPageView("/founding100"); }, []);
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b border-border bg-background">
        <nav aria-label="Founding 100 navigation" className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link to="/welcome" className="font-display text-2xl font-bold whitespace-nowrap">U<span className="text-secondary">⚡️</span>Sportz</Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <Link to="/updates" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground">Updates</Link>
            <Button variant="ghost" size="sm" asChild><Link to={user ? "/" : "/auth"}>{user ? "Open app" : "Sign in"}<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </nav>
      </header>
      <main>
        <section className="max-w-5xl mx-auto px-5 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase mb-5 flex items-center gap-2"><Zap className="h-4 w-4 text-secondary" /> Founding 100</p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-none max-w-3xl">THE FIRST 100<br />CHANGE THE GAME.</h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed">One hundred founding members. Athletes, coaches, creators, podcasters and fans who believe sports deserve a platform built for them — and who want to help build it.</p>
          <Founding100Counter className="mt-8" />
          <div className="grid sm:grid-cols-2 gap-8 mt-14">
            {perks.map(({ icon: Icon, ...p }) => (
              <div key={p.title} className="border-t border-border pt-6">
                <Icon className="h-6 w-6 text-primary mb-4" />
                <h2 className="text-xl">{p.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-10 max-w-xl">Applying does not confirm a founding spot. Every application is reviewed by our team, and membership is confirmed only after approval.</p>
        </section>
        <section id="apply" className="border-t border-border bg-card">
          <div className="max-w-5xl mx-auto px-5 py-16 sm:py-20 grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <p className="text-secondary uppercase text-xs font-semibold mb-4">Apply now</p>
              <h2 className="text-4xl leading-tight">Your spot in the story starts here.</h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">Tell us who you are and what you bring to the game. It takes two minutes.</p>
            </div>
            <Founding100Form />
          </div>
        </section>
      </main>
      <footer className="border-t border-border"><div className="max-w-5xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-5"><span className="text-sm text-muted-foreground">© {new Date().getFullYear()} U⚡️Sportz</span><div className="flex flex-wrap gap-5 text-sm text-muted-foreground"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/unsubscribe">Unsubscribe</Link></div></div></footer>
    </div>
  );
}
