import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Gamepad2, Loader2, Lock, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAME_CATEGORIES, gameListingSchema, gameMoney, summarizeGameSales } from "@/lib/creatorGames";
import type { Tables } from "@/integrations/supabase/types";
import cover from "@/assets/creator-game-cover.jpg";

type Game = Tables<"creator_games">;
const initialForm = { title: "", description: "", category: "sports", price: "0", launchUrl: "" };

export default function CreatorGameStore() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [sales, setSales] = useState<Tables<"creator_game_sales">[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [reviewer, setReviewer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const [external, setExternal] = useState<{ title: string; url: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) { setGames([]); setSales([]); setReviewer(false); return; }
    setLoading(true); setError("");
    const [list, ledger, roles] = await Promise.all([
      supabase.from("creator_games").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("creator_game_sales").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }).limit(1000),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    if (list.error || ledger.error || roles.error) setError("Couldn't load the game store. Please try again.");
    setGames(list.data ?? []); setSales(ledger.data ?? []);
    setReviewer((roles.data ?? []).some(r => ["admin", "moderator"].includes(r.role)));
    const ids = [...new Set((list.data ?? []).map(g => g.creator_id))];
    if (ids.length) {
      const profiles = await supabase.from("profiles").select("id,username").in("id", ids);
      setNames(Object.fromEntries((profiles.data ?? []).map(p => [p.id, p.username])));
    }
    setLoading(false);
  }, [user?.id]);
  useEffect(() => { void load(); }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const parsed = gameListingSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check your game details"); return; }
    setSaving(true);
    const v = parsed.data;
    const details = { title: v.title, description: v.description, category: v.category, price_cents: v.price, status: "draft" };
    const result = editing
      ? await supabase.from("creator_games").update(details).eq("id", editing).eq("creator_id", user.id).select().single()
      : await supabase.from("creator_games").insert(details).select().single();
    if (result.error || !result.data) { toast.error(result.error?.message ?? "Couldn't save your game"); setSaving(false); return; }
    // Keep the saved draft editable if its URL or submission fails.
    setEditing(result.data.id);
    const build = await supabase.from("creator_game_builds").upsert({ game_id: result.data.id, creator_id: user.id, launch_url: v.launchUrl });
    const submission = build.error ? build : await supabase.from("creator_games").update({ status: "pending" }).eq("id", result.data.id);
    setSaving(false);
    if (submission.error) { toast.error("Draft saved, but submission failed. Please try again."); return; }
    setOpen(false); toast.success("Game submitted for review"); await load();
  };
  const edit = async (game: Game) => {
    const { data, error } = await supabase.from("creator_game_builds").select("launch_url").eq("game_id", game.id).single();
    if (error && error.code !== "PGRST116") { toast.error("Couldn't load your game details"); return; }
    setEditing(game.id); setForm({ title: game.title, description: game.description, category: game.category, price: (game.price_cents / 100).toFixed(2), launchUrl: data?.launch_url ?? "" }); setOpen(true);
  };
  const launch = async (game: Game) => {
    setLaunching(game.id);
    const { data, error } = await supabase.rpc("launch_creator_game", { _game_id: game.id });
    setLaunching(null);
    if (error || !data) { toast.error(error?.message ?? "Game unavailable"); return; }
    setExternal({ title: game.title, url: data });
  };
  const review = async (game: Game, approve: boolean) => {
    const { error } = await supabase.rpc("review_creator_game", { _game_id: game.id, _approve: approve });
    if (error) toast.error(error.message); else { toast.success(approve ? "Game approved" : "Game rejected"); await load(); }
  };
  const remove = async (game: Game) => {
    if (!window.confirm(`Delete ${game.title}?`)) return;
    const { error } = await supabase.from("creator_games").delete().eq("id", game.id).eq("creator_id", user?.id ?? "");
    if (error) toast.error("Couldn't delete this game. Games with sales must be retained."); else await load();
  };
  const cards = (rows: Game[], own = false, reviewing = false) => rows.length ? (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(game => <article key={game.id} className="glass-effect overflow-hidden rounded-lg border border-border flex flex-col">
        <div className="relative aspect-video bg-muted">
          <img src={cover} alt="Sports arcade artwork" width={1024} height={576} loading="lazy" className="h-full w-full object-cover" />
          <Badge className="absolute left-3 top-3 capitalize" variant="secondary">{game.category}</Badge>
        </div>
        <div className="p-4 flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-2"><h3 className="font-display text-xl font-bold break-words min-w-0">{game.title}</h3><span className="shrink-0 font-semibold text-secondary">{game.price_cents === 0 ? "Free" : gameMoney(game.price_cents)}</span></div>
          <p className="text-xs text-muted-foreground">by {names[game.creator_id] ?? "Creator"}</p>
          <p className="text-sm text-muted-foreground line-clamp-3 break-words flex-1">{game.description}</p>
          {(own || reviewing) && <Badge className="self-start capitalize" variant="outline">{game.status}</Badge>}
          <div className="flex flex-wrap gap-2">
            {own || reviewing || game.price_cents === 0
              ? <Button className="flex-1" onClick={() => void launch(game)} disabled={launching === game.id}>{launching === game.id ? <Loader2 className="animate-spin" /> : <ExternalLink />}{own || reviewing ? "Preview game" : "Play free"}</Button>
              : <Button variant="outline" className="w-full" disabled><Lock /> Sales not open</Button>}
            {own && <><Button size="icon" variant="outline" aria-label={`Edit ${game.title}`} title="Edit game" onClick={() => void edit(game)}><Pencil /></Button><Button size="icon" variant="outline" aria-label={`Delete ${game.title}`} title="Delete game" onClick={() => void remove(game)}><Trash2 /></Button></>}
          </div>
          {reviewing && <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => void review(game, true)}><ShieldCheck />Approve</Button><Button variant="outline" onClick={() => void review(game, false)}>Reject</Button></div>}
        </div>
      </article>)}
    </div>
  ) : <div className="py-12 text-center border-y border-border"><Gamepad2 className="mx-auto mb-3 h-9 w-9 text-primary" /><p className="font-medium">{own ? "No games submitted yet" : reviewing ? "No games awaiting review" : "No games found"}</p></div>;
  const totals = summarizeGameSales(sales);

  return <section className="mb-10" aria-labelledby="creator-store-heading">
    <div className="flex flex-wrap items-center justify-between gap-4 mb-5"><div><h2 id="creator-store-heading" className="text-2xl font-bold font-display">Creator game store</h2><p className="text-sm text-muted-foreground">Independent games. Fresh competition.</p></div><Button onClick={() => { setEditing(null); setForm(initialForm); setOpen(true); }} disabled={!user}><Plus />List your game</Button></div>
    {!user ? <div className="py-8 text-center border-y border-border"><Button asChild><Link to="/auth">Sign in to browse creator games</Link></Button></div> : <Tabs defaultValue="browse">
      <TabsList className="max-w-full h-auto flex-wrap mb-4"><TabsTrigger value="browse">Store</TabsTrigger><TabsTrigger value="mine">My games</TabsTrigger><TabsTrigger value="earnings">Earnings</TabsTrigger>{reviewer && <TabsTrigger value="review">Review</TabsTrigger>}</TabsList>
      {error && <div role="alert" className="mb-4 flex items-center justify-between gap-3 text-destructive"><span>{error}</span><Button variant="outline" onClick={() => void load()}>Retry</Button></div>}
      {loading ? <div className="py-10 flex justify-center"><Loader2 aria-label="Loading game store" className="animate-spin text-primary" /></div> : <>
        <TabsContent value="browse"><div className="flex gap-3 mb-5"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search creator games" placeholder="Search games" className="pl-9" value={query} onChange={e => setQuery(e.target.value)} /></div><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-32" aria-label="Game category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All genres</SelectItem>{GAME_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent></Select></div>{cards(games.filter(g => g.status === "approved" && (category === "all" || g.category === category) && `${g.title} ${g.description}`.toLowerCase().includes(query.toLowerCase())))}</TabsContent>
        <TabsContent value="mine">{cards(games.filter(g => g.creator_id === user.id), true)}</TabsContent>
        <TabsContent value="earnings"><div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4 shrink-0" />Paid game sales and payouts are not open.</div><div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-5 border-y border-border">{Object.entries(totals).map(([key, value]) => <div key={key}><p className="text-xs capitalize text-muted-foreground">{key === "paid" ? "Paid out" : key}</p><p className="text-xl font-bold">{gameMoney(value)}</p></div>)}</div><h3 className="font-semibold mt-6 mb-3">Sales history</h3>{sales.length ? <div className="space-y-3">{sales.map(s => <div key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-border py-3 text-sm"><span>{games.find(g => g.id === s.game_id)?.title ?? "Game sale"}<Badge variant="outline" className="ml-2">{s.environment}</Badge></span><span>{gameMoney(s.creator_net_cents)} · {s.payout_status.replace(/_/g, " ")}</span></div>)}</div> : <p className="text-sm text-muted-foreground py-6">No sales yet.</p>}</TabsContent>
        {reviewer && <TabsContent value="review">{cards(games.filter(g => ["pending", "approved"].includes(g.status)), false, true)}</TabsContent>}
      </>}
    </Tabs>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit your game" : "List your game"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
      <div><Label htmlFor="game-title">Game title</Label><Input id="game-title" required maxLength={80} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
      <div><Label htmlFor="game-description">Description</Label><Textarea id="game-description" required maxLength={2000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div><Label>Genre</Label><Select value={form.category} onValueChange={category => setForm({ ...form, category })}><SelectTrigger aria-label="Listing genre"><SelectValue /></SelectTrigger><SelectContent>{GAME_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="game-price">Price (USD)</Label><Input id="game-price" type="number" min="0" max="1000" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
      <div><Label htmlFor="game-url">Hosted game URL</Label><Input id="game-url" type="url" required placeholder="https://" maxLength={2000} value={form.launchUrl} onChange={e => setForm({ ...form, launchUrl: e.target.value })} /></div>
      <p className="text-xs text-muted-foreground">Review required before publication. Paid sales are not open.</p>
      <Button type="submit" className="w-full" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}Submit for review</Button>
    </form></DialogContent></Dialog>
    <Dialog open={!!external} onOpenChange={v => { if (!v) setExternal(null); }}><DialogContent><DialogHeader><DialogTitle>{external?.title}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This game opens on an independent creator’s website. U⚡️Sportz account and payment protections do not extend to that website.</p>{external && <><p className="text-sm break-all">{new URL(external.url).hostname}</p><Button asChild><a href={external.url} target="_blank" rel="noopener noreferrer"><ExternalLink />Open game</a></Button></>}</DialogContent></Dialog>
  </section>;
}