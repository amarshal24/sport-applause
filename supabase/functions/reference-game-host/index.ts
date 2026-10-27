import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
const schema=z.discriminatedUnion('action',[
  z.object({action:z.literal('redeem'),runId:z.string().uuid(),token:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
  z.object({action:z.enum(['gameplay','asset']),session:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
]);
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return reply({authorized:false},405);
  try{
    const input=schema.safeParse(await req.json());if(!input.success)return reply({authorized:false},400);
    const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)return reply({authorized:false},503);
    const db=createClient(url,key,{auth:{persistSession:false}});
    if(input.data.action==='redeem'){
      const secret=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
      const result=await db.rpc('begin_reference_host_session',{_run_id:input.data.runId,_token:input.data.token,_session_hash:await hash(secret)});
      if(result.error||!result.data)return reply({authorized:false},403);
      return reply({authorized:true,session:secret,...result.data});
    }
    const result=await db.rpc('check_reference_host_session',{_hash:await hash(input.data.session)});
    if(result.error||!result.data)return reply({authorized:false},403);
    if(input.data.action==='asset')return reply({...result.data,asset:{name:'basketball',shape:'ball',seams:true}});
    return reply({...result.data,game:{title:'Protected free-throw test',target:3,shots:5}});
  }catch{return reply({authorized:false},400);}
});