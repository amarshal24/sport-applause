import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicSubscriptionForm from "@/components/PublicSubscriptionForm";
import Founding100Counter from "@/components/Founding100Counter";
import Founding100Form from "@/components/Founding100Form";
import sampleDunk from "@/assets/sample-dunk.mp4.asset.json";
import sampleFreekick from "@/assets/sample-freekick.mp4.asset.json";
import sampleSprint from "@/assets/sample-sprint.mp4.asset.json";
import court from "@/assets/founders-court.jpg";
import memorabilia from "@/assets/marketplace-memorabilia.jpg";
import { useAuth } from "@/hooks/useAuth";
import { trackPageView } from "@/lib/analytics";
import feedStill from "@/assets/categories/feed.webp.asset.json";
import fansStill from "@/assets/categories/fans.webp.asset.json";
import profileStill from "@/assets/categories/profile.webp.asset.json";
import recruitingStill from "@/assets/categories/recruiting.webp.asset.json";
import recruiterStill from "@/assets/categories/recruiter.webp.asset.json";
import motivationStill from "@/assets/categories/motivation.webp.asset.json";
import gamesStill from "@/assets/categories/games.webp.asset.json";
import topPlaysStill from "@/assets/categories/top-plays.webp.asset.json";
import liveStill from "@/assets/categories/live.webp.asset.json";
import marketplaceStill from "@/assets/categories/marketplace.webp.asset.json";
import messagesStill from "@/assets/categories/messages.webp.asset.json";
import podcastsStill from "@/assets/categories/podcasts.webp.asset.json";
import editorStill from "@/assets/categories/editor.webp.asset.json";
import motionStill from "@/assets/categories/motion-fx.webp.asset.json";
import arStill from "@/assets/categories/ar-studio.webp.asset.json";

const features = [
  { title: "Sports videos, stories & trending", text: "Your highlights, your sport, your community — plus the moments everyone's talking about.", image: feedStill, alt: "Basketball athlete dribbling on an outdoor court", path: "/" },
  { title: "Fans & community", text: "Connect with people who love the game.", image: fansStill, alt: "Sports fans cheering together in a stadium", path: "/fans" },
  { title: "Athlete profiles", text: "Your Top 5, your stats, your story.", image: profileStill, alt: "Athlete portrait on a basketball court", path: "/profile" },
  { title: "Get recruited", text: "Put your talent in front of coaches.", image: recruitingStill, alt: "Soccer athlete training with cones", path: "/recruiting" },
  { title: "Recruiter dashboard", text: "Discover athletes and follow their progress.", image: recruiterStill, alt: "Coach reviewing a clipboard on the sideline", path: "/recruiter-dashboard" },
  { title: "Daily motivation", text: "A little inspiration for your next session.", image: motivationStill, alt: "Runner stretching outside at sunrise", path: "/motivation" },
  { title: "Games", text: "Sports arcade challenges and creator games.", image: gamesStill, alt: "Game controller next to a basketball", path: "/games" },
  { title: "Top Plays", text: "The highlights worth watching again.", image: topPlaysStill, alt: "Basketball player rising for a dunk", path: "/top-plays" },
  { title: "Live content", text: "Streams, applause and replays.", image: liveStill, alt: "Sports camera operator filming beside the field", path: "/live" },
  { title: "Marketplace", text: "Buy and sell sports memorabilia with your community.", image: marketplaceStill, alt: "Framed signed jersey, game-worn helmet and trading cards on a display shelf", path: "/marketplace" },
  { title: "Messages", text: "Stay connected with teammates and friends.", image: messagesStill, alt: "Two teammates sharing a moment on a court bench", path: "/messages" },
  { title: "Podcasts", text: "Sports conversations, memberships and premium episodes.", image: podcastsStill, alt: "Two sports podcasters recording with microphones", path: "/podcasts" },
  { title: "Video editing", text: "Timeline, Animation Center, captions, music and sports effects.", image: editorStill, alt: "Sports footage on a video editing workstation", path: "/editor" },
  { title: "Motion FX Studio", text: "Follow the action with motion-tracked effects.", image: motionStill, alt: "Illustrative basketball with electric motion trails", path: "/motion-studio" },
  { title: "AR Studio & skins", text: "Make your camera moments your own.", image: arStill, alt: "Illustrative athlete wearing a futuristic sports visor", path: "/ar-studio" },
  { title: "Purchases & memberships", text: "Your effects, skins and memberships in one place.", image: gamesStill, alt: "Sports gaming equipment illustrating digital purchases", path: "/purchases" },
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
            {!user && <Button size="sm" asChild><Link to="/auth?mode=signup">Sign up</Link></Button>}
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
              <Button size="lg" variant="outline" asChild className="bg-background/30"><Link to={user ? "/" : "/auth?mode=signup"}>{user ? "Enter U⚡️Sportz" : "Create free account"}</Link></Button>
            </div>
            <a href="#features" className="inline-flex items-center gap-2 text-sm mt-12 text-foreground/80">See what's inside <ArrowDown className="h-4 w-4" /></a>
          </div>
        </section>

        <div className="border-y border-border bg-card"><div className="max-w-5xl mx-auto px-5 py-5 flex flex-wrap justify-between gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">{["Athletes", "Fans", "Creators", "Podcasters", "Gamers", "Coaches"].map(t => <span key={t}>{t}</span>)}</div></div>

        <section id="features" className="max-w-5xl mx-auto px-5 py-16 sm:py-20 scroll-mt-20">
          <p className="text-secondary uppercase text-xs font-semibold mb-3">Built around the game</p>
          <h2 className="text-4xl sm:text-5xl">Everything an athlete needs.<br />Everything a fan loves.</h2>
          <p className="text-xs text-muted-foreground mt-4">Illustrative camera stills · not member photos or app screenshots.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {features.map(f => (
              <figure key={f.title} className="rounded-lg overflow-hidden border border-border bg-card flex flex-col">
                <img src={f.image.url} alt={f.alt} width={480} height={480} loading="lazy" className="w-full aspect-[4/3] object-cover" />
                <figcaption className="p-5 flex flex-col flex-1">
                  <h3 className="text-2xl">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{f.text}</p>
                  <Button variant="link" asChild className="px-0 mt-3 self-start h-auto text-sm"><Link to={user ? f.path : `/auth?mode=signup&next=${encodeURIComponent(f.path)}`} aria-label={`${user ? "Open" : "Join to explore"} ${f.title}`}>{user ? "Open" : "Join to explore"}<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="film" className="bg-card border-y border-border py-14 sm:py-20">
          <div className="max-w-5xl mx-auto px-5">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
              <h2 className="text-4xl">U⚡️Sportz in motion</h2>
              <span className="text-xs uppercase text-secondary font-semibold">Sample videos</span>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { src: sampleDunk.url, title: "Court at dusk", text: "Street-ball highlights, captured like a broadcast." },
                { src: sampleFreekick.url, text: "Free kicks with cinematic style.", title: "Under the lights" },
                { src: sampleSprint.url, title: "Track night", text: "Sprint moments, slowed down and blown up." },
              ].map(v => (
                <figure key={v.title} className="rounded-lg overflow-hidden border border-border bg-background">
                  <video controls playsInline preload="metadata" aria-label={`U⚡️Sportz sample video: ${v.title}`} className="w-full aspect-video object-cover">
                    <source src={v.src} type="video/mp4" />
                  </video>
                  <figcaption className="p-4"><h3 className="text-base font-semibold">{v.title}</h3><p className="text-sm text-muted-foreground mt-1">{v.text}</p></figcaption>
                </figure>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">Cinematic samples showing how moments look on U⚡️Sportz. THE FIRST 100 launch film is still in production.</p>
          </div>
        </section>

        <section id="marketplace" className="border-y border-border bg-card py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <p className="text-secondary uppercase text-xs font-semibold mb-3 flex items-center gap-2"><Zap className="h-3 w-3" /> Marketplace</p>
              <h2 className="text-4xl sm:text-5xl leading-tight">Own a piece<br />of the game.</h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">Buy and sell sports memorabilia with people in your community — jerseys, trading cards, signed items, game-worn gear and equipment. Message sellers directly and arrange safe, in-person pickup.</p>
              <div className="flex flex-wrap gap-2 mt-6">
                {["Memorabilia", "Jerseys", "Trading Cards", "Signed Items", "Game-Worn", "Equipment", "Collectibles"].map(c => (
                  <span key={c} className="text-xs uppercase tracking-wide border border-border rounded-md px-3 py-1.5 text-muted-foreground bg-background/50">{c}</span>
                ))}
              </div>
              <Button size="lg" asChild className="mt-7 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link to={user ? "/marketplace" : "/auth?mode=signup&next=%2Fmarketplace"} aria-label={user ? "Browse the marketplace" : "Join to browse the marketplace"}>
                  {user ? "Browse the marketplace" : "Join to browse the marketplace"}<ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <figure className="order-1 md:order-2 rounded-lg overflow-hidden border border-border">
              <img src={memorabilia} alt="Framed signed jersey, game-worn helmet, trading cards and a signed baseball on a display shelf" width={1600} height={1200} loading="lazy" className="w-full aspect-[4/3] object-cover" />
              <figcaption className="p-4 text-xs text-muted-foreground">Illustrative display · not member listings or member photos.</figcaption>
            </figure>
          </div>
        </section>

        <section id="app" className="max-w-5xl mx-auto px-5 py-16 sm:py-20">
          <p className="text-secondary uppercase text-xs font-semibold mb-3">Inside the app</p>
          <h2 className="text-4xl sm:text-5xl">Built for the way you move.</h2>
          <div className="mt-10 flex flex-wrap items-center gap-4 border border-border rounded-lg bg-card p-5">
            <Smartphone className="h-6 w-6 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground flex-1 min-w-60">U⚡️Sportz works in your browser today. Native mobile apps are planned — we'll announce them here when they're ready.</p>
            <div className="flex gap-3">
              <span className="text-xs uppercase tracking-wide border border-border rounded-md px-3 py-2 text-muted-foreground">iOS · coming soon</span>
              <span className="text-xs uppercase tracking-wide border border-border rounded-md px-3 py-2 text-muted-foreground">Android · coming soon</span>
            </div>
          </div>
        </section>

        <section id="founding100" className="border-y border-border bg-card scroll-mt-20">
          <div className="max-w-5xl mx-auto px-5 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-secondary uppercase text-xs font-semibold mb-4">Founding 100</p>
              <h2 className="text-4xl sm:text-5xl leading-tight">THE FIRST 100<br />CHANGE THE GAME.</h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">One hundred founding members. A permanent badge, priority beta consideration and a direct line to the team. Spots are confirmed only after review.</p>
              <Founding100Counter className="mt-6" />
              <Button variant="link" asChild className="mt-6 p-0 h-auto"><Link to="/founding100">View all founding benefits <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
            <Founding100Form />
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
