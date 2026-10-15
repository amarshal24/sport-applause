import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Heart, Lock, Users } from "lucide-react";
import { summarizeEarnings, type EarningRow } from "@/lib/earnings";

interface Payment extends EarningRow {
  id: string;
  kind: string;
  created_at: string;
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const CreatorEarnings = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<{ amount_cents: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const env = getStripeEnvironment();
      const [pay, po] = await Promise.all([
        supabase
          .from("podcast_payments")
          .select("id, kind, amount_cents, platform_fee_cents, creator_net_cents, refunded_cents, created_at")
          .eq("creator_id", user.id)
          .eq("environment", env)
          .order("created_at", { ascending: false }),
        supabase.from("payouts").select("amount_cents, status").eq("user_id", user.id).eq("environment", env),
      ]);
      setRows((pay.data as Payment[]) ?? []);
      setPayouts(po.data ?? []);
      setLoading(false);
    })();
  }, [user?.id]);

  if (!user) return null;

  const s = summarizeEarnings(rows);
  const sumPayout = (st: string) =>
    payouts.filter((p) => p.status === st).reduce((a, p) => a + p.amount_cents, 0);
  const paidOut = sumPayout("paid");
  const scheduled = sumPayout("scheduled") + sumPayout("processing");
  const failed = sumPayout("failed");
  const balance = s.net - paidOut - scheduled;
  const count = (kind: string) => rows.filter((r) => r.kind === kind).length;

  const tiles = [
    { label: "Gross payments", value: usd(s.gross) },
    { label: "Platform fees (5%)", value: `-${usd(s.fees)}` },
    { label: "Refunds", value: `-${usd(s.refunds)}` },
    { label: "Your net", value: usd(s.net), highlight: true },
  ];

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map((t) => (
              <div key={t.label} className={`rounded-lg p-3 ${t.highlight ? "bg-primary/10" : "bg-muted/50"}`}>
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className={`text-lg font-bold ${t.highlight ? "text-primary" : ""}`}>{t.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">Payout status</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Paid out</p><p className="font-semibold">{usd(paidOut)}</p></div>
              <div><p className="text-xs text-muted-foreground">Scheduled</p><p className="font-semibold">{usd(scheduled)}</p></div>
              <div><p className="text-xs text-muted-foreground">Failed</p><p className="font-semibold">{usd(failed)}</p></div>
              <div><p className="text-xs text-muted-foreground">Not yet scheduled</p><p className="font-semibold">{usd(Math.max(0, balance))}</p></div>
            </div>
            <p className="text-xs text-muted-foreground">Test mode: payouts are simulated. No real money is sent yet.</p>
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
                <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="capitalize">{r.kind}</span>
                  {(r.refunded_cents ?? 0) > 0 && <Badge variant="destructive">Refunded</Badge>}
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
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
