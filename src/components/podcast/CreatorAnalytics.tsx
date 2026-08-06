import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, Eye, Lock, Heart, Crown, Loader2, DollarSign } from "lucide-react";

interface Payment {
  id: string;
  kind: "tip" | "unlock" | "membership";
  podcast_id: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  creator_net_cents: number;
  created_at: string;
}

interface Episode {
  id: string;
  title: string;
  plays_count: number;
}

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 0 },
];

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [activeMembers, setActiveMembers] = useState(0);
  const [mrrCents, setMrrCents] = useState(0);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const env = getStripeEnvironment();
      const [pay, pods, members] = await Promise.all([
        supabase
          .from("podcast_payments")
          .select("id, kind, podcast_id, amount_cents, platform_fee_cents, creator_net_cents, created_at")
          .eq("creator_id", user.id)
          .eq("environment", env)
          .order("created_at", { ascending: true }),
        supabase.from("podcasts").select("id, title, plays_count").eq("user_id", user.id),
        supabase
          .from("creator_memberships")
          .select("status, price_cents, current_period_end")
          .eq("creator_id", user.id)
          .eq("environment", env),
      ]);

      setPayments((pay.data as Payment[]) ?? []);
      setEpisodes((pods.data as Episode[]) ?? []);
      const active = (members.data ?? []).filter(
        (m: any) =>
          ["active", "trialing", "past_due"].includes(m.status) &&
          (!m.current_period_end || new Date(m.current_period_end) > new Date()),
      );
      setActiveMembers(active.length);
      setMrrCents(active.reduce((s: number, m: any) => s + (m.price_cents ?? 0), 0));
      setLoading(false);
    })();
  }, [user?.id]);

  const scoped = useMemo(() => {
    if (!days) return payments;
    const cutoff = Date.now() - days * 86400000;
    return payments.filter((p) => new Date(p.created_at).getTime() >= cutoff);
  }, [payments, days]);

  const totals = useMemo(() => {
    const by = (kind: string) => scoped.filter((p) => p.kind === kind);
    const sumNet = (rows: Payment[]) => rows.reduce((s, r) => s + r.creator_net_cents, 0);
    return {
      tipsCount: by("tip").length,
      tipsNet: sumNet(by("tip")),
      unlocksCount: by("unlock").length,
      unlocksNet: sumNet(by("unlock")),
      subsNet: sumNet(by("membership")),
      gross: scoped.reduce((s, r) => s + r.amount_cents, 0),
      fees: scoped.reduce((s, r) => s + r.platform_fee_cents, 0),
      net: sumNet(scoped),
    };
  }, [scoped]);

  const totalViews = useMemo(
    () => episodes.reduce((s, e) => s + (e.plays_count ?? 0), 0),
    [episodes],
  );

  // Daily earnings trend, split by revenue type
  const trend = useMemo(() => {
    const span = days || 90;
    const buckets: Record<string, { date: string; tips: number; unlocks: number; memberships: number }> = {};
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      buckets[d] = { date: d.slice(5), tips: 0, unlocks: 0, memberships: 0 };
    }
    scoped.forEach((p) => {
      const d = p.created_at.slice(0, 10);
      const b = buckets[d];
      if (!b) return;
      const value = p.creator_net_cents / 100;
      if (p.kind === "tip") b.tips += value;
      else if (p.kind === "unlock") b.unlocks += value;
      else b.memberships += value;
    });
    return Object.values(buckets);
  }, [scoped, days]);

  // Per-episode earnings + views
  const perEpisode = useMemo(() => {
    const map = new Map<string, { title: string; earnings: number; views: number; unlocks: number; tips: number }>();
    episodes.forEach((e) =>
      map.set(e.id, { title: e.title, earnings: 0, views: e.plays_count ?? 0, unlocks: 0, tips: 0 }),
    );
    scoped.forEach((p) => {
      if (!p.podcast_id) return;
      const row = map.get(p.podcast_id);
      if (!row) return;
      row.earnings += p.creator_net_cents / 100;
      if (p.kind === "unlock") row.unlocks += 1;
      if (p.kind === "tip") row.tips += 1;
    });
    return [...map.values()].sort((a, b) => b.earnings - a.earnings || b.views - a.views);
  }, [episodes, scoped]);

  const chartEpisodes = perEpisode.slice(0, 8).map((e) => ({
    ...e,
    name: e.title.length > 14 ? `${e.title.slice(0, 14)}…` : e.title,
  }));

  if (!user) return null;

  const stats = [
    { label: "Total plays", value: totalViews.toLocaleString(), icon: Eye },
    { label: "Unlocks", value: `${totals.unlocksCount} · ${usd(totals.unlocksNet)}`, icon: Lock },
    { label: "Tips", value: `${totals.tipsCount} · ${usd(totals.tipsNet)}`, icon: Heart },
    { label: "Subscriptions", value: `${activeMembers} · ${usd(mrrCents)}/mo`, icon: Crown },
  ];

  return (
    <Card className="p-4 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Creator analytics</h3>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.label}
              size="sm"
              variant={days === r.days ? "default" : "outline"}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-muted/50 p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="h-3 w-3" /> {label}
                </p>
                <p className="text-lg font-bold mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Gross</p>
              <p className="text-lg font-bold">{usd(totals.gross)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Platform fee (5%)</p>
              <p className="text-lg font-bold">-{usd(totals.fees)}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" /> Your net
              </p>
              <p className="text-lg font-bold text-primary">{usd(totals.net)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Earnings trend</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v: number) => `$${Number(v).toFixed(2)}`}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="unlocks" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="tips" stroke="hsl(var(--destructive))" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="memberships" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Top episodes by earnings</p>
            {chartEpisodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No episodes yet.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartEpisodes} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} height={45} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v: number, key) => (key === "earnings" ? `$${Number(v).toFixed(2)}` : v)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {perEpisode.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2">Episode</th>
                    <th className="text-right">Plays</th>
                    <th className="text-right">Unlocks</th>
                    <th className="text-right">Tips</th>
                    <th className="text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {perEpisode.map((e) => (
                    <tr key={e.title} className="border-b last:border-0">
                      <td className="py-2 pr-2 truncate max-w-[160px]">{e.title}</td>
                      <td className="text-right">{e.views}</td>
                      <td className="text-right">{e.unlocks}</td>
                      <td className="text-right">{e.tips}</td>
                      <td className="text-right font-medium">${e.earnings.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default CreatorAnalytics;
