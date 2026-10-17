import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@22.0.2";
import { z } from "npm:zod@3";
import { createStripeClient } from "../_shared/stripe.ts";
import { resolveOrCreateCustomer } from "../_shared/customer.ts";
const schema = z.object({ gameId: z.string().uuid(), environment: z.literal("sandbox"), returnUrl: z.string().url() }).strict();
Deno.serve(async req => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return reply({ error: "Restricted test purchases only" }, 400);
    const destination = new URL(parsed.data.returnUrl);
    const origin = req.headers.get("origin");
    if (!origin || destination.origin !== origin || destination.pathname !== "/checkout/return") return reply({ error: "Invalid return address" }, 400);
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Checkout unavailable");
    const db = createClient(url, key);
    const { data: auth, error: authError } = await db.auth.getUser(req.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "");
    if (authError || !auth.user) return reply({ error: "Sign in required" }, 401);
    const { data: order, error } = await db.rpc("begin_creator_game_order", { _game_id: parsed.data.gameId, _buyer_id: auth.user.id });
    if (error || !order) return reply({ error: error?.message ?? "Game unavailable" }, 403);
    const stripe = createStripeClient("sandbox");
    const customer = await resolveOrCreateCustomer(stripe, { userId: auth.user.id, email: auth.user.email });
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page", mode: "payment", customer,
      return_url: parsed.data.returnUrl,
      line_items: [{ quantity: 1, price_data: { currency: order.currency, unit_amount: order.amount_cents, tax_behavior: "inclusive", product_data: { name: order.title, tax_code: "txcd_10201000" } } }],
      payment_intent_data: { description: order.title, metadata: { kind: "creator_game", orderId: order.id } },
      metadata: { kind: "creator_game", orderId: order.id, userId: auth.user.id, managed_payments: "true" },
      managed_payments: { enabled: true },
    } as Stripe.Checkout.SessionCreateParams, { idempotencyKey: `game-order-${order.id}` });
    const saved = await db.from("creator_game_orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    if (saved.error) { await stripe.checkout.sessions.expire(session.id); throw new Error("Could not record checkout"); }
    return reply({ clientSecret: session.client_secret, orderId: order.id });
  } catch { return reply({ error: "Could not start game checkout" }, 500); }
});