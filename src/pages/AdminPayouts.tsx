import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Banknote } from "lucide-react";
import { toast } from "sonner";

type Payout = {
  id: string;
  user_id: string;
  amount_cents: number;
  status: string;
  scheduled_for: string;
  processed_at: string | null;
  reference_number: string | null;
  payment_method: string | null;
  bank_name: string | null;
  account_last4: string | null;
  received_confirmed_at: string | null;
  environment: string;
};

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

const AdminPayouts = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Payout | null>(null);
  const [form, setForm] = useState({ reference: "", method: "Bank transfer", bank: "", last4: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payouts")
      .select("id, user_id, amount_cents, status, scheduled_for, processed_at, reference_number, payment_method, bank_name, account_last4, received_confirmed_at, environment")
      .order("scheduled_for", { ascending: false })
      .limit(200);
    const rows = (data as Payout[]) ?? [];
    setPayouts(rows);
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.username])));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (user)
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const submit = async () => {
    if (!target) return;
    if (!form.reference.trim()) return toast.error("Enter the reference number");
    if (form.last4 && !/^\d{4}$/.test(form.last4)) return toast.error("Account ending must be 4 digits");
    setSaving(true);
    const { error } = await supabase.rpc("mark_payout_paid", {
      _payout_id: target.id,
      _reference: form.reference,
      _method: form.method,
      _bank_name: form.bank,
      _last4: form.last4,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Payout marked as paid");
    setTarget(null);
    load();
  };

  if (isAdmin === null) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!isAdmin) return <div className="max-w-5xl mx-auto p-6 text-muted-foreground">Admins only.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Banknote className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Creator payouts</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        After you send money to a creator, mark the payout as paid with the transfer reference so they can track it.
      </p>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
      ) : payouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payouts yet.</p>
      ) : (
        <div className="space-y-2">
          {payouts.map((p) => (
            <Card key={p.id} className="p-3 flex items-start justify-between gap-3">
              <div className="text-sm space-y-0.5">
                <p className="font-medium">{money(p.amount_cents)} · @{names[p.user_id] ?? "unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  Scheduled {p.scheduled_for}{p.environment !== "live" ? " · test" : ""}
                </p>
                {p.reference_number && (
                  <p className="text-xs text-muted-foreground">
                    Ref {p.reference_number}
                    {p.bank_name ? ` · ${p.bank_name}` : ""}
                    {p.account_last4 ? ` ·••${p.account_last4}` : ""}
                    {p.received_confirmed_at ? " · creator confirmed received" : " · waiting for creator"}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status}</Badge>
                {p.status !== "paid" && (
                  <Button size="sm" onClick={() => { setTarget(p); setForm({ reference: "", method: "Bank transfer", bank: "", last4: "" }); }}>
                    Mark paid
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {target ? money(target.amount_cents) : ""} as paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Reference number *</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. TRX-20261016-0042" /></div>
            <div><Label>Payment method</Label><Input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="Bank transfer, PayPal…" /></div>
            <div><Label>Bank name</Label><Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="e.g. Chase" /></div>
            <div><Label>Account ending (last 4 digits)</Label><Input value={form.last4} maxLength={4} inputMode="numeric" onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, "") })} placeholder="1234" /></div>
            <p className="text-xs text-muted-foreground">Only store the last 4 digits — never full account numbers.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayouts;
