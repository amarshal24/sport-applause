import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Clapperboard, Film, GraduationCap, Mic, Play, Radio, Smartphone, Users, Video, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicSubscriptionForm from "@/components/PublicSubscriptionForm";
import Founding100Counter from "@/components/Founding100Counter";
import court from "@/assets/founders-court.jpg";
import { useAuth } from "@/hooks/useAuth";
import { trackPageView } from "@/lib/analytics";

const features = [
  { icon: Video, title: "Sports videos", text: "Highlights, stories and the moments worth sharing — built for every sport." },
  { icon: Wand2, title: "AI object-tracking effects", text: "Motion FX Studio tracks the ball, the player, the play — and adds cinematic effects that follow the action." },
  { icon: Clapperboard, title: "Full video editing", text: "A multi-track timeline with sports effects, captions, music and MP4 export. Your footage stays yours." },
  { icon: GraduationCap, title: "Athlete profiles", text: "Top 5 highlights, recruiting videos and stats that put your talent in front of coaches." },
  { icon: Mic, title: "Podcasts", text: "Sports podcasts with fan memberships, premium episodes and creator earnings." },
  { icon: Radio, title: "Live content", text: "Live streams, real-time applause and replays for every side of the game." },
  { icon: Users, title: "Community", text: "Athletes, fans, creators, coaches and gamers — one community built around the game." },
];

const screenshots = [
  { title: "Your feed", text: "Highlights Reel — scroll the plays that matter to you." },
  { title: "Motion FX Studio", text: "Track any object. Add the effect. Export in MP4." },
  { title: "Athlete profile", text: "Your Top 5, your stats, your story." },
];

export default function MarketingHome() {
  const { user } = useAuth();
  useEffect(() => { trackPageView("/"); }, []);
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b border-border bg-background/95 sticky top-0 z-40 backdrop-blur">
        <nav aria-label="Main navigation" className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link to="/welcome" className="font-display text-2xl font-bold whitespace-nowrap">U<span className="text-secondary">⚡️</span>Sportz</Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <a href="#features" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground">Features</a>
            <Link to="/updates" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground">Updates</Link>
            <Button variant="ghost" size="sm" asChild><Link to={user ? "/" : "/auth"}>{user ? "Open app" : "Sign in"}<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button size="sm" asChild className="hidden sm:inline-flex"><Link to="/founding100">Founding 100</Link></Button>
          </div>
        </nav>
      </header>
      <main>
        <section className="relative isolate overflow-hidden founders-hero">
          <img src={court} alt="Three athletes together on an outdoor basketball court at dusk" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 w-full h-full object-cover object-[65%_center]" />
          <div className="absolute inset-0 founders-photo-scrim" />
          <div className="relative max-w-5xl mx-auto px-5 py-20 sm:py-28">
            <p className="text-sm font-semibold uppercase mb-5 flex items-center gap-2"><Zap className="h-4 w-4 text-secondary" /> All sports. One platform.</p>
            <h1 className="text-5xl sm:text-7xl font-bold leading-none max-w-3xl">YOUR GAME.<br />YOUR PLATFORM.</h1>
            <p className="text-2xl sm:text-3xl mt-5 font-display">Create. Compete. Connect.</p>
            <p className="text-base mt-5 max-w-md text-foreground/80">U⚡️Sportz is the sports platform built for the next generation — highlights, editing, podcasts, live streams and community in one place.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link to="/founding100">Join the Founding 100 <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild className="bg-background/30"><Link to={user ? "/" : "/auth"}>Enter U⚡️Sportz</Link></Button>
            </div>
            <a href="#features" className="inline-flex items-center gap-2 text-sm mt-12 text-foreground/80">See what's inside <ArrowDown className="h-4 w-4" /></a>
          </div>
        </section>

        <div className="border-y border-border bg-card"><div className="max-w-5xl mx-auto px-5 py-5 flex flex-wrap justify-between gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">{["Athletes", "Fans", "Creators", "Podcasters", "Gamers", "Coaches"].map(t => <span key={t}>{t}</span>)}</div></div>

        <section id="features" className="max-w-5xl mx-auto px-5 py-16 sm:py-20 scroll-mt-20">
          <p className="text-secondary uppercase text-xs font-semibold mb-3">Built around the game</p>
          <h2 className="text-4xl sm:text-5xl">Everything an athlete needs.<br />Everything a fan loves.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {features.map(({ icon: Icon, ...f }) => (
              <div key={f.title} className="border-t border-border pt-6">
                <Icon className="h-6 w-6 text-primary mb-5" />
                <h3 className="text-2xl">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="film" className="bg-card border-y border-border py-14 sm:py-20">
          <div className="max-w-5xl mx-auto px-5">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
              <h2 className="text-4xl">THE FIRST 100</h2>
              <span className="text-xs uppercase text-secondary font-semibold">U⚡️Sportz film · In production</span>
            </div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-background">
              <img src={court} alt="Cover frame for the upcoming U⚡️Sportz film, THE FIRST 100" width={1536} height={1024} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-5">
                <span className="rounded-full border border-border bg-background/70 p-5"><Play className="h-8 w-8 text-secondary" /></span>
                <p className="text-sm text-muted-foreground max-w-sm">Our cinematic launch film is in production. This is where it will premiere.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="app" className="max-w-5xl mx-auto px-5 py-16 sm:py-20">
          <p className="text-secondary uppercase text-xs font-semibold mb-3">Inside the app</p>
          <h2 className="text-4xl sm:text-5xl">Built for the way you move.</h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-10">
            {screenshots.map(s => (
              <figure key={s.title} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="aspect-[9/16] max-h-72 w-full bg-background flex items-center justify-center border-b border-border">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground px-6 text-center">App preview<br />coming soon</p>
                </div>
                <figcaption className="p-5"><h3 className="text-lg">{s.title}</h3><p className="text-sm text-muted-foreground mt-2">{s.text}</p></figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4 border border-border rounded-lg bg-card p-5">
            <Smartphone className="h-6 w-6 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground flex-1 min-w-60">U⚡️Sportz works in your browser today. Native mobile apps are planned — we'll announce them here and in the newsletter when they're ready.</p>
            <div className="flex gap-3">
              <span className="text-xs uppercase tracking-wide border border-border rounded-md px-3 py-2 text-muted-foreground">iOS · coming soon</span>
              <span className="text-xs uppercase tracking-wide border border-border rounded-md px-3 py-2 text-muted-foreground">Android · coming soon</span>
            </div>
          </div>
        </section>

        <section id="founding100" className="border-y border-border bg-card">
          <div className="max-w-5xl mx-auto px-5 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-secondary uppercase text-xs font-semibold mb-4">Founding 100</p>
              <h2 className="text-4xl sm:text-5xl leading-tight">THE FIRST 100<br />CHANGE THE GAME.</h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">One hundred founding members. A permanent badge, priority beta consideration and a direct line to the team. Spots are confirmed only after review.</p>
              <Founding100Counter className="mt-6" />
              <Button size="lg" asChild className="mt-8 bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link to="/founding100">Apply for the Founding 100 <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
            <div className="relative">
              <img src={court} alt="Athletes on the court — the community the Founding 100 is building" width={1536} height={1024} loading="lazy" className="rounded-lg border border-border aspect-video object-cover" />
              <Film className="absolute -top-4 -right-4 h-10 w-10 text-secondary bg-background border border-border rounded-full p-2" />
            </div>
          </div>
        </section>

        <section id="updates" className="max-w-5xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-secondary text-xs uppercase font-semibold mb-4">Stay connected</p>
            <h2 className="text-4xl">Your sports.<br />Your updates.</h2>
            <p className="text-muted-foreground mt-5 leading-relaxed">Newsletters and event announcements — only with your explicit consent, and you can unsubscribe anytime.</p>
            <Button variant="link" asChild className="p-0 h-auto mt-4"><Link to="/updates">See what we send <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <PublicSubscriptionForm />
        </section>
      </main>
      <footer className="border-t border-border"><div className="max-w-5xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-5"><span className="text-sm text-muted-foreground">© {new Date().getFullYear()} U⚡️Sportz</span><div className="flex flex-wrap gap-5 text-sm text-muted-foreground"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/unsubscribe">Unsubscribe</Link>{user && <><Link to="/admin/founding100">Founding 100 review</Link><Link to="/admin/founders">Founders Club</Link><Link to="/admin/subscribers">Subscribers</Link></>}</div></div></footer>
    </div>
  );
}
