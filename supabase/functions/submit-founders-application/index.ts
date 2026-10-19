import { createClient } from "npm:@supabase/supabase-js@2";
import { foundersApplicationSchema } from "../_shared/foundersValidation.ts";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  try {
    const raw = await req.text();
    if (raw.length > 12000) return reply(413, { error: "Application is too long" });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return reply(400, { error: "Invalid application" }); }
    const parsed = foundersApplicationSchema.safeParse(input);
    if (!parsed.success) return reply(400, { error: "Please check your name, email, applicant type and reason." });
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return reply(503, { error: "Applications are temporarily unavailable. Please try later." });
    const db = createClient(url, key);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
    for (const value of [`ip:${ip}`, `email:${parsed.data.email}`]) {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
      const hash = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
      const { data, error } = await db.rpc("consume_founders_club_limit", { _key_hash: hash });
      if (error) return reply(503, { error: "Applications are temporarily unavailable. Please try later." });
      if (!data) return reply(429, { error: "Too many applications. Please try again in an hour." });
    }
    const { website: _website, ...application } = parsed.data;
    const { data, error } = await db.from("founders_club_applications").insert(application).select("id").single();
    if (error || !data) return reply(503, { error: "Your application could not be saved. Please try again." });
    return reply(201, { id: data.id, confirmationSent: false });
  } catch { return reply(500, { error: "Your application could not be saved. Please try again." }); }
});