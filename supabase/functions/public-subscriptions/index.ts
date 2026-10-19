import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
const topics = ["basketball","football","soccer","tennis","baseball","volleyball","swimming","running","cycling","other-sports","media","podcasts","live-events","coaching","fitness","creators"] as const;
const schema = z.discriminatedUnion("action", [
  z.object({action:z.literal("subscribe"),email:z.string().trim().toLowerCase().email().max(255),interests:z.array(z.enum(topics)).min(1).max(16),newsletter:z.boolean(),events:z.boolean(),website:z.string().max(0).optional()}),
  z.object({action:z.literal("unsubscribe"),token:z.string().regex(/^[a-f0-9]{64}$/),scope:z.enum(["all","newsletter","events"])}),
]);
const reply=(status:number,body:object)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
async function hash(value:string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,"0")).join(""); }
Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST") return reply(405,{error:"Method not allowed"});
  try {
    const raw=await req.text(); if(raw.length>6000) return reply(413,{error:"Request too large"});
    const parsed=schema.safeParse(JSON.parse(raw)); if(!parsed.success) return reply(400,{error:"Please check your preferences"});
    const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!key) return reply(503,{error:"Temporarily unavailable"});
    const db=createClient(url,key); const input=parsed.data;
    if(input.action==="unsubscribe") {
      const {data,error}=await db.rpc("unsubscribe_public_subscription",{_hash:await hash(input.token),_scope:input.scope});
      if(error) return reply(503,{error:"Could not update preferences"});
      return data?reply(200,{updated:true}):reply(400,{error:"This unsubscribe link is invalid"});
    }
    if(!input.newsletter&&!input.events) return reply(400,{error:"Choose newsletter or event updates"});
    const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,"0")).join("");
    const {data,error}=await db.rpc("create_public_subscription",{_email:input.email,_interests:[...new Set(input.interests)],_newsletter:input.newsletter,_events:input.events,_hash:await hash(token)});
    if(error) return reply(503,{error:"Could not save subscription"});
    // Never rotate another subscriber's token or reveal their preferences on email alone.
    return reply(200,{saved:true,token:data?token:null});
  } catch {return reply(400,{error:"Invalid request"});}
});