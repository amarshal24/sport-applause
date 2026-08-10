import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Payout = {
  id: string;
  amount_cents: number;
  status: string;
  scheduled_for: string;
  processed_at: string | null;
  failure_reason: string | null;
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const statusVariant = (status: string) =>
  status === "paid" ? "default" : status === "failed" ? "destructive" : "secondary";

const PayoutSchedule = () => {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payouts")
      .select("id, amount_cents, status, scheduled_for, processed_at, failure_reason")
      .order("scheduled_for", { ascending: false })
      .limit(12);
    setPayouts((data as Payout[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("payouts-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payouts", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const refreshSchedule = async () => {
    setRunning(true);
    const { error } = await supabase.functions.invoke("payout-scheduler", { body: {} });
    setRunning(false);
    if (error) return toast.error("Could not refresh payout schedule");
    toast.success("Payout schedule refreshed");
    load();
  };

  if (!user) return null;

  const next = payouts.find((p) => p.status === "scheduled");

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Payout schedule</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={refreshSchedule} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {next
          ? `Next payout of ${money(next.amount_cents)} is scheduled for ${next.scheduled_for}.`
          : "No payout scheduled yet — earnings are scheduled automatically once you have a balance."}
      </p>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : payouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payout history yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {payouts.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium">{money(p.amount_cents)}</p>
                <p className="text-xs text-muted-foreground">
                  {p.processed_at
                    ? `Processed ${new Date(p.processed_at).toLocaleDateString()}`
                    : `Scheduled ${p.scheduled_for}`}
                </p>
                {p.failure_reason && (
                  <p className="text-xs text-destructive mt-0.5">{p.failure_reason}</p>
                )}
              </div>
              <Badge variant={statusVariant(p.status) as "default" | "secondary" | "destructive"}>
                {p.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default PayoutSchedule;
