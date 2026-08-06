import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Heart, Lock, Users } from "lucide-react";

interface Payment {
  id: string;
  kind: string;
  amount_cents: number;
  platform_fee_cents: number;
  creator_net_cents: number;
  created_at: string;
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const CreatorEarnings = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("podcast_payments")
        .select("id, kind, amount_cents, platform_fee_cents, creator_net_cents, created_at")
        .eq("creator_id", user.id)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(50);
      setRows((data as Payment[]) ?? []);
      setLoading(false);
    })();
  }, [user?.id]);

  if (!user) return null;

  const gross = rows.reduce((s, r) => s + r.amount_cents, 0);
  const fees = rows.reduce((s, r) => s + r.platform_fee_cents, 0);
  const net = rows.reduce((s, r) => s + r.creator_net_cents, 0);
  const count = (kind: string) => rows.filter((r) => r.kind === kind).length;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Your earnings</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Gross</p>
              <p className="text-lg font-bold">{usd(gross)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Platform fee (5%)</p>
              <p className="text-lg font-bold">-{usd(fees)}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Your net</p>
              <p className="text-lg font-bold text-primary">{usd(net)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {count("tip")} tips</span>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {count("unlock")} unlocks</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {count("membership")} membership payments</span>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No earnings yet — turn on tips or set an episode price to start.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {rows.slice(0, 10).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span className="capitalize">{r.kind}</span>
                  <span className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-medium">{usd(r.creator_net_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
};

export default CreatorEarnings;
