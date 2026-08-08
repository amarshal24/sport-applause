import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Lock, Heart, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import PodcastCheckoutModal, { PodcastCheckoutRequest } from "./PodcastCheckoutModal";

interface DiscoverPodcast {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  audio_url: string;
  thumbnail_url: string | null;
  is_premium: boolean;
  unlock_price_cents: number;
  tips_enabled: boolean;
}

const TIP_AMOUNTS = [100, 500, 1000];
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const PodcastDiscover = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<DiscoverPodcast[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [creatorSettings, setCreatorSettings] = useState<
    Record<string, { membership_enabled: boolean; membership_price_cents: number; tips_enabled: boolean }>
  >({});
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<PodcastCheckoutRequest | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const env = getStripeEnvironment();
      const [pods, payments, memberships] = await Promise.all([
        supabase
          .from("podcasts")
          .select("id, user_id, title, description, audio_url, thumbnail_url, is_premium, unlock_price_cents, tips_enabled")
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("podcast_payments")
          .select("podcast_id")
          .eq("payer_id", user.id)
          .eq("kind", "unlock"),
        supabase
          .from("creator_memberships")
          .select("creator_id, status, current_period_end")
          .eq("fan_id", user.id)
          .eq("environment", env),
      ]);

      const list = (pods.data as DiscoverPodcast[]) ?? [];
      setItems(list);
      setUnlocked(new Set((payments.data ?? []).map((p: any) => p.podcast_id).filter(Boolean)));
      setMemberOf(
        new Set(
          (memberships.data ?? [])
            .filter(
              (m: any) =>
                ["active", "trialing", "past_due"].includes(m.status) &&
                (!m.current_period_end || new Date(m.current_period_end) > new Date()),
            )
            .map((m: any) => m.creator_id),
        ),
      );

      const creatorIds = [...new Set(list.map((p) => p.user_id))];
      if (creatorIds.length) {
        const { data: settings } = await supabase.rpc("get_creator_pricing", {
          _creator_ids: creatorIds,
        });

        const map: Record<string, any> = {};
        (settings ?? []).forEach((s: any) => { map[s.user_id] = s; });
        setCreatorSettings(map);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  if (!user) return null;

  const canPlay = (p: DiscoverPodcast) =>
    !p.is_premium || unlocked.has(p.id) || memberOf.has(p.user_id);

  const startTip = (p: DiscoverPodcast, amountCents: number) => {
    if (!p.tips_enabled || creatorSettings[p.user_id]?.tips_enabled === false) {
      return toast.error("This creator isn't accepting tips");
    }
    setCheckout({ kind: "tip", podcastId: p.id, amountCents, title: `Tip ${usd(amountCents)}` });
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Support creators</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No other episodes to support yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((p) => {
            const settings = creatorSettings[p.user_id];
            return (
              <Card key={p.id} className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{p.title}</h3>
                      {p.is_premium && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Lock className="h-3 w-3" /> {usd(p.unlock_price_cents)}
                        </Badge>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                  </div>
                </div>

                {canPlay(p) ? (
                  <audio controls preload="none" src={p.audio_url} className="w-full h-9" />
                ) : (
                  <Button
                    className="w-full gap-2"
                    onClick={() =>
                      setCheckout({
                        kind: "unlock",
                        podcastId: p.id,
                        title: `Unlock “${p.title}” — ${usd(p.unlock_price_cents)}`,
                      })
                    }
                  >
                    <Lock className="h-4 w-4" /> Unlock for {usd(p.unlock_price_cents)}
                  </Button>
                )}

                <div className="flex flex-wrap gap-2">
                  {p.tips_enabled && settings?.tips_enabled !== false &&
                    TIP_AMOUNTS.map((amt) => (
                      <Button key={amt} size="sm" variant="outline" className="gap-1" onClick={() => startTip(p, amt)}>
                        <Heart className="h-3 w-3" /> {usd(amt)}
                      </Button>
                    ))}
                  {settings?.membership_enabled && !memberOf.has(p.user_id) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1"
                      onClick={() =>
                        setCheckout({
                          kind: "membership",
                          creatorId: p.user_id,
                          title: `Membership — ${usd(settings.membership_price_cents)}/mo`,
                        })
                      }
                    >
                      <Crown className="h-3 w-3" /> {usd(settings.membership_price_cents)}/mo
                    </Button>
                  )}
                  {memberOf.has(p.user_id) && (
                    <Badge className="gap-1"><Crown className="h-3 w-3" /> Member</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PodcastCheckoutModal request={checkout} onClose={() => setCheckout(null)} />
    </section>
  );
};

export default PodcastDiscover;
