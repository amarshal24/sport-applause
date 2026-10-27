import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { createStripeClient } from '../_shared/stripe.ts';
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('list')}).strict(),
 z.object({action:z.literal('create')}).strict(),
 z.object({action:z.enum(['checks','allocate','dispute_open','dispute_close','close']),runId:z.string().uuid()}).strict(),
]);
const random=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
 const input=schema.parse(await req.json());const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)throw Error('Unavailable');
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data:auth,error:authError}=await db.auth.getUser(req.headers.get('Authorization')?.replace(/^Bearer /,'')??'');
 if(authError||!auth.user)return reply({error:'Sign in required'},401);
 const role=await db.rpc('has_role',{_user_id:auth.user.id,_role:'admin'});if(role.error||role.data!==true)return reply({error:'Admin required'},403);
 const must=(result:{error:unknown})=>{if(result.error)throw Error('Test record update failed');};
 if(input.action==='list'){
   const runs=await db.from('game_test_runs').select('*').eq('admin_id',auth.user.id).is('closed_at',null).order('created_at',{ascending:false});must(runs);
   const games=await db.from('creator_games').select('id,title,status,price_cents').order('created_at',{ascending:false}).limit(200);must(games);
   const deliveries=await db.from('creator_game_delivery').select('game_id,verified_at,reviewed_at');must(deliveries);
   const controls=await db.from('creator_game_sale_controls').select('*');must(controls);
   const ids=(runs.data??[]).map(r=>r.game_id);
   const orders=ids.length?await db.from('creator_game_orders').select('*').in('game_id',ids):{data:[],error:null};must(orders);
   const sales=ids.length?await db.from('creator_game_sales').select('*').in('game_id',ids):{data:[],error:null};must(sales);
   return reply({runs:runs.data,games:games.data,deliveries:deliveries.data,controls:controls.data,orders:orders.data,sales:sales.data,liveEnabled:false});
 }
 if(input.action==='create'){
   const existing=await db.from('game_test_runs').select('id').eq('admin_id',auth.user.id).is('closed_at',null);must(existing);if((existing.data?.length??0)>=1)return reply({error:'Close the existing test before creating another'},409);
   // Dedicated existing test account only; never modify creator settings or existing games.
   const creator=await db.from('profiles').select('id').eq('username','testcreator206417').single();must(creator);if(!creator.data||creator.data.id===auth.user.id)throw Error('Dedicated test creator unavailable');
   const gameId=crypto.randomUUID(),runId=crypto.randomUUID();
   must(await db.from('creator_games').insert({id:gameId,creator_id:creator.data.id,title:'Protected test game '+runId.slice(0,6),description:'Isolated sandbox reference host fixture. No real money.',category:'sports',price_cents:499,status:'pending'}));
   try{
     must(await db.from('creator_game_builds').insert({game_id:gameId,creator_id:creator.data.id,launch_url:url+'/functions/v1/reference-game-host'}));
     must(await db.from('creator_game_delivery').insert({game_id:gameId,host_key_hash:await hash(random())}));
     must(await db.from('game_test_runs').insert({id:runId,admin_id:auth.user.id,creator_id:creator.data.id,game_id:gameId}));
     return reply({runId,gameId});
   }catch(e){await db.from('game_test_runs').delete().eq('id',runId);await db.from('creator_games').delete().eq('id',gameId);throw e;}
 }
 const run=await db.from('game_test_runs').select('*').eq('id',input.runId).eq('admin_id',auth.user.id).is('closed_at',null).single();if(run.error||!run.data)return reply({error:'Test run not found'},404);
 const r=run.data;
 if(input.action==='checks'){
   const delivery=await db.from('creator_game_delivery').select('revision').eq('game_id',r.game_id).single();must(delivery);if(!delivery.data)throw Error('Delivery unavailable');
   const token=random(),secret=random();
   must(await db.from('creator_game_launch_tokens').insert({game_id:r.game_id,buyer_id:auth.user.id,token_hash:await hash(token),delivery_revision:delivery.data.revision,environment:'sandbox',preview:true}));
   const valid=await db.rpc('begin_reference_host_session',{_run_id:r.id,_token:token,_session_hash:await hash(secret)});must(valid);
   const replay=await db.rpc('begin_reference_host_session',{_run_id:r.id,_token:token,_session_hash:await hash(random())});
   const denied=await db.rpc('check_reference_host_session',{_hash:await hash(random())});must(denied);
   const validSession=await db.rpc('check_reference_host_session',{_hash:await hash(secret)});must(validSession);
   const expired=random();must(await db.from('creator_game_launch_tokens').insert({game_id:r.game_id,buyer_id:auth.user.id,token_hash:await hash(expired),delivery_revision:delivery.data.revision,environment:'sandbox',preview:true,expires_at:new Date(Date.now()-1000).toISOString()}));
   const expiredResult=await db.rpc('begin_reference_host_session',{_run_id:r.id,_token:expired,_session_hash:await hash(random())});
   const wrongKey=await db.rpc('check_creator_game_host_access',{_game_id:r.game_id,_host_key:random(),_user_id:auth.user.id,_revision:delivery.data.revision,_preview:false});must(wrongKey);
   const stale=random(),staleHash=await hash(stale);must(await db.from('game_test_host_sessions').insert({run_id:r.id,user_id:auth.user.id,delivery_revision:crypto.randomUUID(),preview:true,secret_hash:staleHash}));
   const staleResult=await db.rpc('check_reference_host_session',{_hash:staleHash});must(staleResult);
   const checks={preview:!!validSession.data,replayDenied:!!replay.error,unpaidDenied:denied.data===null,expiredDenied:!!expiredResult.error,wrongKeyDenied:wrongKey.data===false,staleRevisionDenied:staleResult.data===null};
   if(Object.values(checks).every(Boolean)){
     must(await db.from('creator_game_delivery').update({reviewed_at:new Date().toISOString(),reviewed_by:auth.user.id}).eq('game_id',r.game_id));
     must(await db.from('creator_games').update({status:'approved'}).eq('id',r.game_id));
     must(await db.from('creator_game_sale_controls').upsert({game_id:r.game_id,test_sales_enabled:true}));
   }
   return reply({checks,scope:'Reference host sandbox only; not external-host certification',session:secret});
 }
 if(input.action==='allocate'){
   const allocation=await db.rpc('allocate_reference_game_payout',{_run_id:r.id});must(allocation);return reply({payoutId:allocation.data,sent:false});
 }
 if(input.action==='dispute_open'||input.action==='dispute_close'){
   const orders=await db.from('creator_game_orders').select('payment_intent_id').eq('game_id',r.game_id).eq('environment','sandbox').eq('buyer_id',auth.user.id);must(orders);
   const paid=(orders.data??[]).find(o=>o.payment_intent_id);if(!paid?.payment_intent_id)return reply({error:'Complete a test payment first'},409);
   must(await db.rpc('dispute_creator_game_order',{_payment_intent:paid.payment_intent_id,_open:input.action==='dispute_open',_environment:'sandbox'}));
   return reply({simulated:true,providerDispute:false});
 }
 const orders=await db.from('creator_game_orders').select('stripe_session_id,status').eq('game_id',r.game_id);must(orders);
 for(const order of orders.data??[])if(order.status==='pending'&&order.stripe_session_id){try{await createStripeClient('sandbox').checkout.sessions.expire(order.stripe_session_id);}catch{return reply({error:'Could not expire pending test checkout; retry after it closes'},409);}}
 const sales=await db.from('creator_game_sales').select('payout_id').eq('game_id',r.game_id);must(sales);const payouts=[...new Set((sales.data??[]).flatMap(s=>s.payout_id?[s.payout_id]:[]))];
 must(await db.from('game_test_host_sessions').delete().eq('run_id',r.id));
 must(await db.from('creator_game_review_reports').delete().in('review_id',(await db.from('creator_game_reviews').select('id').eq('game_id',r.game_id)).data?.map(x=>x.id)??[]));
 must(await db.from('creator_game_reviews').delete().eq('game_id',r.game_id));
 must(await db.from('creator_game_sales').delete().eq('game_id',r.game_id));
 must(await db.from('creator_game_orders').delete().eq('game_id',r.game_id));
 if(payouts.length)must(await db.from('payouts').delete().in('id',payouts).eq('source','creator_game').eq('environment','sandbox'));
 must(await db.from('game_test_runs').delete().eq('id',r.id));must(await db.from('creator_games').delete().eq('id',r.game_id));
 return reply({closed:true,providerTestTransactionsRetained:true});
 }catch{return reply({error:'Game test action could not be completed'},503);}
});