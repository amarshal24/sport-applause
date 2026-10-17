import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "./stripe.ts";
export async function reconcileGameSession(db: ReturnType<typeof createClient>, sessionId: string, env: StripeEnv) {
  const stripe = createStripeClient(env);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.kind !== "creator_game" || !session.metadata.orderId) return false;
  if (session.payment_status !== "paid") return true;
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!pi) throw new Error("Missing game payment intent");
  const result = await db.rpc("settle_creator_game_order", { _order_id: session.metadata.orderId, _session_id: session.id, _payment_intent: pi, _amount: session.amount_total, _currency: session.currency, _environment: env });
  if (result.error) throw new Error("Game settlement not recorded");
  const intent = await stripe.paymentIntents.retrieve(pi, { expand: ["latest_charge"] });
  const charge = intent.latest_charge;
  if (charge && typeof charge !== "string") {
    const refund = await db.rpc("refund_creator_game_order", { _payment_intent: pi, _refunded: charge.amount_refunded, _environment: env });
    if (refund.error) throw new Error("Game refund reconciliation failed");
    const dispute = await db.rpc("dispute_creator_game_order", { _payment_intent: pi, _open: charge.disputed, _environment: env });
    if (dispute.error) throw new Error("Game dispute reconciliation failed");
  }
  return true;
}