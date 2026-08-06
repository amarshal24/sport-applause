import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

const MonetizationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    payout_email: "",
    payout_country: "",
    tips_enabled: true,
    membership_enabled: false,
    membership_price: "4.99",
    payout_email_alerts: true,
    payout_schedule: "monthly",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("creator_payouts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          payout_email: data.payout_email ?? "",
          payout_country: data.payout_country ?? "",
          tips_enabled: data.tips_enabled,
          membership_enabled: data.membership_enabled,
          membership_price: (data.membership_price_cents / 100).toFixed(2),
          payout_email_alerts: data.payout_email_alerts ?? true,
          payout_schedule: data.payout_schedule ?? "monthly",
        });
      } else {
        setForm((f) => ({ ...f, payout_email: user.email ?? "" }));
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    const price = Math.round(parseFloat(form.membership_price) * 100);
    if (form.membership_enabled && (!Number.isFinite(price) || price < 100 || price > 10000)) {
      return toast.error("Membership price must be between $1 and $100");
    }
    if (form.payout_email && !/^\S+@\S+\.\S+$/.test(form.payout_email)) {
      return toast.error("Enter a valid payout email");
    }
    setSaving(true);
    const { error } = await supabase.from("creator_payouts").upsert(
      {
        user_id: user.id,
        payout_email: form.payout_email || null,
        payout_country: form.payout_country || null,
        tips_enabled: form.tips_enabled,
        membership_enabled: form.membership_enabled,
        membership_price_cents: Number.isFinite(price) ? price : 499,
        payout_email_alerts: form.payout_email_alerts,
        payout_schedule: form.payout_schedule,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Monetization settings saved");
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Monetization &amp; payouts</h3>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="tips">Accept listener tips</Label>
          <p className="text-xs text-muted-foreground">Fans can send $1–$500 on any episode.</p>
        </div>
        <Switch
          id="tips"
          checked={form.tips_enabled}
          onCheckedChange={(v) => setForm((f) => ({ ...f, tips_enabled: v }))}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="membership">Monthly membership</Label>
          <p className="text-xs text-muted-foreground">Unlocks all your premium episodes.</p>
        </div>
        <Switch
          id="membership"
          checked={form.membership_enabled}
          onCheckedChange={(v) => setForm((f) => ({ ...f, membership_enabled: v }))}
        />
      </div>

      {form.membership_enabled && (
        <div className="space-y-2">
          <Label htmlFor="mprice">Membership price (USD / month)</Label>
          <Input
            id="mprice"
            type="number"
            min="1"
            max="100"
            step="0.01"
            value={form.membership_price}
            onChange={(e) => setForm((f) => ({ ...f, membership_price: e.target.value }))}
          />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="payout-email">Payout email</Label>
          <Input
            id="payout-email"
            type="email"
            value={form.payout_email}
            onChange={(e) => setForm((f) => ({ ...f, payout_email: e.target.value }))}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payout-country">Country</Label>
          <Input
            id="payout-country"
            value={form.payout_country}
            maxLength={56}
            onChange={(e) => setForm((f) => ({ ...f, payout_country: e.target.value }))}
            placeholder="United States"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="payout-schedule">Payout schedule</Label>
          <Select
            value={form.payout_schedule}
            onValueChange={(v) => setForm((f) => ({ ...f, payout_schedule: v }))}
          >
            <SelectTrigger id="payout-schedule">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Every 2 weeks</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-4 sm:pt-7">
          <div>
            <Label htmlFor="payout-alerts">Payout email alerts</Label>
            <p className="text-xs text-muted-foreground">
              Emails for scheduled, sent and failed payouts.
            </p>
          </div>
          <Switch
            id="payout-alerts"
            checked={form.payout_email_alerts}
            onCheckedChange={(v) => setForm((f) => ({ ...f, payout_email_alerts: v }))}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        A 5% platform fee is deducted from every tip, unlock and membership. Your net earnings are
        tracked below and paid out to the account above.
      </p>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </Card>
  );
};

export default MonetizationSettings;
