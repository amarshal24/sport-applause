import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@22.0.2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const PLATFORM_FEE_BPS = 500; // 5%

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

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabase();
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token ?? "");
    const user = userData?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sign in to support creators" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const kind: string = body.kind;
    const returnUrl: string = body.returnUrl;
    const environment: StripeEnv = body.environment === "live" ? "live" : "sandbox";
    if (!["tip", "unlock", "membership"].includes(kind) || typeof returnUrl !== "string") {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let creatorId: string | null = null;
    let podcastId: string | null = null;
    let amountCents = 0;
    let label = "";

    if (kind === "membership") {
      creatorId = String(body.creatorId ?? "");
      const { data: settings } = await supabase
        .from("creator_payouts")
        .select("membership_enabled, membership_price_cents")
        .eq("user_id", creatorId)
        .maybeSingle();
      if (!settings?.membership_enabled) throw new Error("This creator has no membership");
      amountCents = Number(settings.membership_price_cents);
      label = "Monthly creator membership";
    } else {
      podcastId = String(body.podcastId ?? "");
      const { data: podcast } = await supabase
        .from("podcasts")
        .select("id, user_id, title, is_premium, unlock_price_cents, tips_enabled")
        .eq("id", podcastId)
        .maybeSingle();
      if (!podcast) throw new Error("Podcast not found");
      creatorId = podcast.user_id as string;

      if (kind === "unlock") {
        if (!podcast.is_premium) throw new Error("This episode is free");
        amountCents = Number(podcast.unlock_price_cents);
        label = `Unlock: ${podcast.title}`;
      } else {
        if (!podcast.tips_enabled) throw new Error("Tips are off for this episode");
        amountCents = Math.round(Number(body.amountCents));
        label = `Tip: ${podcast.title}`;
      }
    }

    if (creatorId === user.id) throw new Error("You can't pay yourself");
    if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 50000) {
      throw new Error("Amount must be between $1 and $500");
    }

    const platformFee = Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
    const stripe = createStripeClient(environment);
    const customerId = await resolveOrCreateCustomer(stripe, {
      email: user.email ?? undefined,
      userId: user.id,
    });

    const metadata = {
      userId: user.id,
      kind: `podcast_${kind}`,
      creatorId: creatorId!,
      ...(podcastId && { podcastId }),
      amountCents: String(amountCents),
      platformFeeCents: String(platformFee),
      creatorNetCents: String(amountCents - platformFee),
    };

    const isRecurring = kind === "membership";
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: label },
          unit_amount: amountCents,
          ...(isRecurring && { recurring: { interval: "month" } }),
        },
        quantity: 1,
      }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      customer: customerId,
      ...(!isRecurring && { payment_intent_data: { description: label } }),
      managed_payments: { enabled: true },
      metadata,
      ...(isRecurring && { subscription_data: { metadata } }),
    } as Stripe.Checkout.SessionCreateParams);

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-podcast-checkout error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
