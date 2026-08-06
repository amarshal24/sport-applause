import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

function resolvePriceId(item: any) {
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: item?.price?.product,
      price_id: resolvePriceId(item),
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function recordCreatorPayment(session: any, env: StripeEnv) {
  const md = session.metadata ?? {};
  const kind = String(md.kind ?? "").replace("podcast_", "");
  if (!["tip", "unlock", "membership"].includes(kind)) return false;
  if (!md.userId || !md.creatorId) return true;

  await getSupabase().from("podcast_payments").upsert(
    {
      payer_id: md.userId,
      creator_id: md.creatorId,
      podcast_id: md.podcastId ?? null,
      kind,
      amount_cents: Number(md.amountCents ?? session.amount_total ?? 0),
      platform_fee_cents: Number(md.platformFeeCents ?? 0),
      creator_net_cents: Number(md.creatorNetCents ?? 0),
      stripe_session_id: session.id,
      stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
      environment: env,
    },
    { onConflict: "stripe_session_id" },
  );
  return true;
}

async function upsertCreatorMembership(subscription: any, env: StripeEnv) {
  const md = subscription.metadata ?? {};
  if (md.kind !== "podcast_membership" || !md.userId || !md.creatorId) return false;
  const item = subscription.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("creator_memberships").upsert(
    {
      fan_id: md.userId,
      creator_id: md.creatorId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
      status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      price_cents: Number(md.amountCents ?? 0),
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
  return true;
}

async function recordOneTimePurchase(session: any, env: StripeEnv) {
  if (await recordCreatorPayment(session, env)) return;

  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId || !priceId) {
    console.log("Session missing userId/priceId metadata; skipping unlock");
    return;
  }
  if (session.mode !== "payment") return;

  await getSupabase().from("fx_purchases").upsert(
    {
      user_id: userId,
      price_id: priceId,
      stripe_session_id: session.id,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      environment: env,
    },
    { onConflict: "stripe_session_id" },
  );
}


async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await getSupabase()
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", event.data.object.id)
        .eq("environment", env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") {
        await recordOneTimePurchase(session, env);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await recordOneTimePurchase(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Invalid env query parameter:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
