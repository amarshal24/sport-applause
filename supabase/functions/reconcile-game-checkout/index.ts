import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { reconcileGameSession } from "../_shared/gamePayments.ts";
Deno.serve(async req => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const input = z.object({ sessionId: z.string().regex(/^cs_test_[a-zA-Z0-9]+$/), environment: z.literal("sandbox") }).strict().parse(await req.json());
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw Error("Unavailable");
    const db = createClient(url, key);
    const { data: auth } = await db.auth.getUser(req.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "");
    if (!auth.user) return reply({ error: "Sign in required" }, 401);
    const { data: order } = await db.from("creator_game_orders").select("id").eq("stripe_session_id", input.sessionId).eq("buyer_id", auth.user.id).eq("environment", "sandbox").maybeSingle();
    if (!order) return reply({ error: "Order not found" }, 404);
    await reconcileGameSession(db, input.sessionId, "sandbox");
    const { data } = await db.from("creator_game_orders").select("status").eq("id", order.id).single();
    return reply({ status: data?.status ?? "pending" });
  } catch { return reply({ error: "Payment confirmation unavailable" }, 503); }
});