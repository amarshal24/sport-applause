import { createClient } from "npm:@supabase/supabase-js@2";
import { founding100ApplicationSchema } from "../_shared/founding100Validation.ts";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
const sha256 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");

const sportInterests: Record<string, string> = { basketball: "basketball", football: "football", soccer: "soccer", tennis: "tennis", volleyball: "volleyball", baseball: "baseball", swimming: "swimming", running: "running", cycling: "cycling", gym: "fitness", hiking: "other-sports", other: "other-sports" };
const roleInterests: Record<string, string> = { creator: "creators", podcaster: "podcasts", coach: "coaching" };

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  try {
    const raw = await req.text();
    if (raw.length > 12000) return reply(413, { error: "Application is too long" });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return reply(400, { error: "Invalid application" }); }
    const parsed = founding100ApplicationSchema.safeParse(input);
    if (!parsed.success) return reply(400, { error: "Please check your name, email, role and sport." });
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return reply(503, { error: "Applications are temporarily unavailable. Please try later." });
    const db = createClient(url, key);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
    for (const value of [`ip:${ip}`, `email:${parsed.data.email}`]) {
      const { data, error } = await db.rpc("consume_founding100_limit", { _key_hash: await sha256(value) });
      if (error) return reply(503, { error: "Applications are temporarily unavailable. Please try later." });
      if (!data) return reply(429, { error: "Too many applications. Please try again in an hour." });
    }
    const { website: _website, newsletter_consent, ...application } = parsed.data;
    const { data, error } = await db.from("founding100_applications").insert(application).select("id").single();
    if (error?.code === "23505") return reply(200, { alreadyApplied: true });
    if (error || !data) return reply(503, { error: "Your application could not be saved. Please try again." });
    let token: string | null = null;
    if (newsletter_consent) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
      const interests = [...new Set([sportInterests[application.sport] ?? "other-sports", roleInterests[application.role]].filter(Boolean))];
      const { data: subId, error: subError } = await db.rpc("create_public_subscription", { _email: application.email, _interests: interests, _newsletter: true, _events: false, _hash: await sha256(token) });
      if (subError || !subId) token = null;
    }
    return reply(201, { id: data.id, alreadyApplied: false, token });
  } catch { return reply(500, { error: "Your application could not be saved. Please try again." }); }
});
