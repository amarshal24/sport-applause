import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const schema = z.object({ gameId: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();

Deno.serve(async (req) => {
  const respond = (body: unknown, status: number) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  try {
    const hostKey = req.headers.get("X-Game-Host-Key");
    if (!hostKey || !/^[a-f0-9]{64}$/.test(hostKey)) return respond({ error: "Invalid host credentials" }, 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return respond({ error: "Invalid launch request" }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return respond({ error: "Verification unavailable" }, 503);
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.rpc("redeem_creator_game_launch", {
      _game_id: parsed.data.gameId, _host_key: hostKey, _token: parsed.data.token,
    });
    if (error) return respond({ error: "Launch authorization invalid or expired" }, 403);
    return respond({ authorized: true, ...data }, 200);
  } catch {
    return respond({ error: "Invalid launch request" }, 400);
  }
});