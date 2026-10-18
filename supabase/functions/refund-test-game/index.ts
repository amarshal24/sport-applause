import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { createStripeClient } from "../_shared/stripe.ts";
import { reconcileGameSession } from "../_shared/gamePayments.ts";
Deno.serve(async req => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const input = z.object({ orderId: z.string().uuid(), amountCents: z.number().int().positive() }).strict().parse(await req.json());
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw Error("Unavailable");
    const db = createClient(url, key);
    const { data: auth } = await db.auth.getUser(req.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "");
    if (!auth.user) return reply({ error: "Sign in required" }, 401);
    const { data: admin } = await db.rpc("has_role", { _user_id: auth.user.id, _role: "admin" });
    if (!admin) return reply({ error: "Admin required" }, 403);
    const { data: order } = await db.from("creator_game_orders").select("*").eq("id", input.orderId).eq("buyer_id", auth.user.id).eq("environment", "sandbox").single();
    if (!order?.payment_intent_id || !order.stripe_session_id || input.amountCents > order.amount_cents - order.refunded_cents) return reply({ error: "Invalid test refund" }, 400);
    await createStripeClient("sandbox").refunds.create({ payment_intent: order.payment_intent_id, amount: input.amountCents }, { idempotencyKey: `game-refund-${order.id}-${order.refunded_cents}-${input.amountCents}` });
    await reconcileGameSession(db, order.stripe_session_id, "sandbox");
    return reply({ refunded: true });
  } catch { return reply({ error: "Test refund could not be confirmed" }, 503); }
});