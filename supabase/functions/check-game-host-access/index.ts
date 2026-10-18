import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
const schema = z.object({ gameId: z.string().uuid(), userId: z.string().uuid(), revision: z.string().uuid(), preview: z.boolean() }).strict();
Deno.serve(async req => {
  const reply = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const hostKey = req.headers.get("X-Game-Host-Key");
    if (!hostKey || !/^[a-f0-9]{64}$/.test(hostKey)) return reply({ authorized: false }, 401);
    const input = schema.parse(await req.json());
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return reply({ authorized: false }, 503);
    const { data, error } = await createClient(url, key).rpc("check_creator_game_host_access", { _game_id: input.gameId, _user_id: input.userId, _revision: input.revision, _preview: input.preview, _host_key: hostKey });
    return reply({ authorized: !error && data === true }, !error && data === true ? 200 : 403);
  } catch { return reply({ authorized: false }, 400); }
});