// Creates scheduled payouts, advances them to paid/failed, and notifies
// creators in-app + by email.
//
// Invocation:
//  - cron / server: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> -> all creators
//  - signed-in user: Authorization: Bearer <user jwt> -> that creator only
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { notify, serviceClient } from "../_shared/notify.ts";

const APP_URL = "https://sport-applause.lovable.app";

const PERIOD_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const addDays = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = serviceClient();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";

  let onlyUserId: string | null = null;
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    onlyUserId = data.user.id;
  }

  try {
    let settingsQuery = supabase
      .from("creator_payouts")
      .select("user_id, payout_email, payout_email_alerts, payout_schedule");
    if (onlyUserId) settingsQuery = settingsQuery.eq("user_id", onlyUserId);
    const { data: creators, error: cErr } = await settingsQuery;
    if (cErr) throw new Error(cErr.message);

    const today = new Date().toISOString().slice(0, 10);
    const results: Record<string, unknown>[] = [];

    for (const creator of creators ?? []) {
      const userId = creator.user_id as string;
      const emailOpts = {
        email: creator.payout_email as string | null,
        emailEnabled: creator.payout_email_alerts !== false,
      };

      // 1. Advance any due payouts to paid / failed.
      const { data: due } = await supabase
        .from("payouts")
        .select("id, amount_cents, scheduled_for, status")
        .eq("user_id", userId)
        .eq("status", "scheduled")
        .lte("scheduled_for", today);

      for (const payout of due ?? []) {
        const failureReason = !creator.payout_email
          ? "No payout email on file. Add one in monetization settings."
          : (payout.amount_cents as number) <= 0
            ? "Payout amount was zero at processing time."
            : null;

        await supabase
          .from("payouts")
          .update({
            status: failureReason ? "failed" : "paid",
            processed_at: new Date().toISOString(),
            failure_reason: failureReason,
          })
          .eq("id", payout.id);

        await notify(supabase, {
          userId,
          type: failureReason ? "payout_failed" : "payout_paid",
          title: failureReason
            ? `Payout of ${money(payout.amount_cents as number)} failed`
            : `Payout of ${money(payout.amount_cents as number)} sent`,
          body: failureReason
            ? `We couldn't send your payout. ${failureReason}`
            : `Your creator earnings of ${money(payout.amount_cents as number)} are on the way to ${creator.payout_email}.`,
          link: `${APP_URL}/podcasts`,
          ...emailOpts,
        });
        results.push({ userId, payout: payout.id, status: failureReason ? "failed" : "paid" });
      }

      // 2. Schedule the next payout if none is pending.
      const { count: pending } = await supabase
        .from("payouts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "scheduled");
      if ((pending ?? 0) > 0) continue;

      const { data: earnings } = await supabase
        .from("podcast_payments")
        .select("creator_net_cents")
        .eq("creator_id", userId);
      const gross = (earnings ?? []).reduce(
        (sum, row) => sum + (row.creator_net_cents as number),
        0,
      );

      const { data: settled } = await supabase
        .from("payouts")
        .select("amount_cents")
        .eq("user_id", userId)
        .in("status", ["paid", "processing", "scheduled"]);
      const alreadyPaid = (settled ?? []).reduce(
        (sum, row) => sum + (row.amount_cents as number),
        0,
      );

      const owed = gross - alreadyPaid;
      if (owed <= 0) continue;

      const days = PERIOD_DAYS[(creator.payout_schedule as string) ?? "monthly"] ?? 30;
      const scheduledFor = addDays(days);

      const { data: created, error: pErr } = await supabase
        .from("payouts")
        .insert({
          user_id: userId,
          amount_cents: owed,
          status: "scheduled",
          scheduled_for: scheduledFor,
        })
        .select("id")
        .single();
      if (pErr) {
        console.error("payout insert failed:", pErr.message);
        continue;
      }

      await notify(supabase, {
        userId,
        type: "payout_scheduled",
        title: `Payout of ${money(owed)} scheduled`,
        body: `Your next ${creator.payout_schedule ?? "monthly"} payout of ${money(owed)} is scheduled for ${scheduledFor}.`,
        link: `${APP_URL}/podcasts`,
        ...emailOpts,
      });
      results.push({ userId, payout: created.id, status: "scheduled" });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("payout-scheduler error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
