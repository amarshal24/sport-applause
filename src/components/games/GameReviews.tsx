import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, Star, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";
import { gameReviewSchema, summarizeGameReviews } from "@/lib/gameReviews";
import ReportButton from "@/components/ReportButton";

export default function GameReviews({ gameId, environment, onChanged }: { gameId: string; environment: string; onChanged: () => void }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Tables<"creator_game_reviews">[]>([]);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(""); setEligible(false);
    const [list, access] = await Promise.all([
      supabase.from("creator_game_reviews").select("*").eq("game_id", gameId).eq("environment", environment).is("hidden_at", null).order("created_at", { ascending: false }),
      supabase.rpc("can_review_creator_game", { _game_id: gameId, _environment: environment }),
    ]);
    if (list.error || access.error) setError("Couldn’t load reviews. Please try again.");
    else {
      setReviews(list.data ?? []); setEligible(access.data === true);
      const own = list.data?.find(r => r.buyer_id === user?.id);
      setRating(own?.rating ?? 0); setBody(own?.body ?? "");
    }
    setLoading(false);
  }, [gameId, environment, user?.id]);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaved(false);
    const parsed = gameReviewSchema.safeParse({ rating, body });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your review"); return; }
    setSaving(true); setError("");
    const { error } = await supabase.rpc("submit_creator_game_review", { _game_id: gameId, _environment: environment, _rating: parsed.data.rating, _body: parsed.data.body });
    setSaving(false);
    if (error) { setError(error.message); return; }
    await load(); setSaved(true); onChanged();
  };
  const summary = summarizeGameReviews(reviews);
  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" aria-label="Loading reviews" /></div>;
  return <div className="space-y-5">
    <div className="flex items-center gap-2"><Star className="h-5 w-5 text-secondary" /><span className="font-semibold">{summary.count ? `${summary.average.toFixed(1)} / 5 · ${summary.count} ${summary.count === 1 ? "review" : "reviews"}` : "No reviews yet"}</span>{environment === "sandbox" && <Badge variant="outline">Test purchases</Badge>}</div>
    {error && <div role="alert" className="text-sm text-destructive">{error}<Button variant="link" onClick={() => void load()}>Refresh</Button></div>}
    {eligible ? <form onSubmit={submit} className="space-y-3 border-y border-border py-5">
      <div className="flex items-center gap-2 text-sm text-primary"><ShieldCheck className="h-4 w-4" />Verified buyer</div>
      <div role="group" aria-label="Your rating" className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <Button key={n} type="button" variant="ghost" size="icon" title={`${n} ${n === 1 ? "star" : "stars"}`} aria-label={`Rate ${n} ${n === 1 ? "star" : "stars"}`} aria-pressed={rating === n} onClick={() => setRating(n)}><Star className={n <= rating ? "h-6 w-6 fill-secondary text-secondary" : "h-6 w-6 text-muted-foreground"} /></Button>)}</div>
      <Label htmlFor="game-review-body">Your review</Label><Textarea id="game-review-body" required maxLength={2000} rows={4} value={body} onChange={e => setBody(e.target.value)} />
      <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{reviews.some(r => r.buyer_id === user?.id) ? "Update review" : "Submit review"}</Button>
      {saved && <p role="status" className="text-sm text-primary">Review saved</p>}
    </form> : <p className="flex gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4 shrink-0 mt-0.5" />Only verified buyers with current game access can submit a review.</p>}
    <div className="divide-y divide-border">{reviews.map(r => <article key={r.id} className="py-4 space-y-2"><div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">{r.rating} / 5 ★</span><Badge variant="outline">Verified purchase</Badge>{r.buyer_id === user?.id && <span className="text-muted-foreground">Your review</span>}<time className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</time><ReportButton targetType="game_review" targetId={r.id} /></div><p className="text-sm whitespace-pre-wrap break-words">{r.body}</p></article>)}</div>
  </div>;
}