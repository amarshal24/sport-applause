import { ArrowDown, ArrowUpRight, Gamepad2, GraduationCap, Mic, Video, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FoundersClubForm from "@/components/FoundersClubForm";
import court from "@/assets/founders-court.jpg";
import { useAuth } from "@/hooks/useAuth";

const paths = [
  { icon: Video, title: "Your moment.", description: "Highlights, stories and the sports moments worth sharing.", label: "Highlights Reel", to: "/trending" },
  { icon: GraduationCap, title: "Your next chapter.", description: "Athlete profiles and recruiting highlights that put your talent first.", label: "Athletes & coaches", to: "/recruiting" },
  { icon: Mic, title: "Your voice.", description: "Podcasts and live conversations for every side of the game.", label: "Podcasts & live", to: "/podcasts" },
  { icon: Gamepad2, title: "Your game.", description: "Sports challenges, friendly competition and creator-made games.", label: "Games & community", to: "/games" },
];

export default function Landing() {
  const { user } = useAuth();
  return <div className="bg-background min-h-screen">
    <header className="border-b border-border bg-background">
      <nav aria-label="Landing navigation" className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        <Link to="/welcome" className="font-display text-2xl font-bold whitespace-nowrap">U<span className="text-secondary">⚡️</span>Sportz</Link>
        <div className="flex items-center gap-2 sm:gap-5">
          <a href="#community" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground">The community</a>
          <Button variant="ghost" size="sm" asChild><Link to={user ? "/" : "/auth"}>{user ? "Open app" : "Sign in"}<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
          <Button size="sm" asChild className="hidden sm:inline-flex"><a href="#apply">Founders Club</a></Button>
        </div>
      </nav>
    </header>
    <main>
      <section className="relative isolate overflow-hidden founders-hero">
        <img src={court} alt="Three athletes together on an outdoor basketball court" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 w-full h-full object-cover object-[65%_center]" />
        <div className="absolute inset-0 founders-photo-scrim" />
        <div className="relative max-w-5xl mx-auto px-5 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase mb-5 flex items-center gap-2"><Zap className="h-4 w-4 text-secondary" /> All sports. One community.</p>
          <h1 className="text-6xl sm:text-8xl font-bold leading-none">U⚡️Sportz</h1>
          <p className="text-2xl sm:text-3xl mt-5 font-display max-w-lg">The next generation<br />of sports belongs to you.</p>
          <p className="text-base mt-5 max-w-sm text-foreground/80">For the athletes, fans and creators who live the game — on and off the court.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><a href="#apply">Apply to the Founders Club <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
            <Button size="lg" variant="outline" asChild className="bg-background/30"><Link to={user ? "/" : "/auth"}>Enter U⚡️Sportz</Link></Button>
          </div>
          <a href="#community" className="inline-flex items-center gap-2 text-sm mt-12 text-foreground/80">Meet your community <ArrowDown className="h-4 w-4" /></a>
        </div>
      </section>
      <div className="border-y border-border bg-card"><div className="max-w-5xl mx-auto px-5 py-5 flex flex-wrap justify-between gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">{["Athletes", "Fans", "Creators", "Podcasters", "Gamers", "Coaches"].map(t => <span key={t}>{t}</span>)}</div></div>
      <section id="community" className="max-w-5xl mx-auto px-5 py-16 sm:py-20 scroll-mt-6">
        <p className="text-secondary uppercase text-xs font-semibold mb-3">Built around the game</p>
        <h2 className="text-4xl sm:text-5xl">More than the final score.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
          {paths.map(({icon: Icon, ...p}) => <div key={p.to} className="border-t border-border pt-6"><Icon className="h-6 w-6 text-primary mb-5" /><h3 className="text-2xl">{p.title}</h3><p className="text-sm text-muted-foreground mt-3 mb-5 leading-relaxed">{p.description}</p><Button variant="link" asChild className="p-0 h-auto"><Link to={user ? p.to : "/auth"}>{p.label}<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button></div>)}
        </div>
      </section>
      <section id="film" className="bg-card border-y border-border py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-5"><div className="flex flex-wrap items-end justify-between gap-3 mb-7"><h2 className="text-4xl">On and off the court.</h2><span className="text-xs uppercase text-secondary font-semibold">U⚡️Sportz film · Preview coming soon</span></div><img src={court} alt="The U⚡️Sportz sports community film cover" width={1536} height={1024} loading="lazy" className="w-full aspect-video object-cover rounded-lg" /></div>
      </section>
      <section id="apply" className="max-w-5xl mx-auto px-5 py-16 sm:py-24 grid md:grid-cols-2 gap-10 md:gap-16 scroll-mt-6">
        <div><p className="text-secondary uppercase text-xs font-semibold mb-4">Founders Club</p><h2 className="text-4xl sm:text-5xl leading-tight">Be part of<br />what comes next.</h2><p className="mt-5 text-muted-foreground leading-relaxed">Sports are better when everyone has a place. Bring your passion, your perspective and your connection to the game.</p><p className="mt-5 text-muted-foreground leading-relaxed">Apply as an athlete, fan, creator, podcaster, gamer or coach. Tell us why you want to be part of the U⚡️Sportz community.</p><div className="mt-8 border-t border-border pt-5 flex items-center gap-3 text-sm"><Zap className="h-5 w-5 text-secondary" /> Different roles. Same love of the game.</div></div>
        <FoundersClubForm />
      </section>
    </main>
    <footer className="border-t border-border"><div className="max-w-5xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-5"><span className="text-sm text-muted-foreground">© {new Date().getFullYear()} U⚡️Sportz</span><div className="flex gap-5 text-sm text-muted-foreground"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link>{user && <Link to="/admin/founders">Application review</Link>}</div></div></footer>
  </div>;
}