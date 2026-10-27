import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { createStripeClient } from '../_shared/stripe.ts';
const schema = z.object({environment:z.enum(['sandbox','live']),cursor:z.string().regex(/^ch_[a-zA-Z0-9]+$/).optional()}).strict();
Deno.serve(async req => {
  const reply = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(req.method==='OPTIONS') return reply({});
  if(req.method!=='POST') return reply({error:'Method not allowed'},405);
  try {
    const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url || !key) throw Error('Configuration unavailable');
    const db=createClient(url,key);
    const {data:auth,error:authError}=await db.auth.getUser(req.headers.get('Authorization')?.replace(/^Bearer /,'') ?? '');
    if(authError || !auth.user) return reply({error:'Sign in required'},401);
    const admin=await db.rpc('has_role',{_user_id:auth.user.id,_role:'admin'});
    if(admin.error || admin.data!==true) return reply({error:'Admins only'},403);
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success) return reply({error:'Invalid revenue filter'},400);
    const env=parsed.data.environment;
    const [fx,podcasts,games,payouts,subscriptions,charges]=await Promise.all([
      db.from('fx_purchases').select('id,user_id,price_id,stripe_session_id,stripe_payment_intent_id,refunded_at,created_at').eq('environment',env).order('created_at',{ascending:false}).limit(200),
      db.from('podcast_payments').select('id,creator_id,kind,amount_cents,platform_fee_cents,refunded_cents,stripe_payment_intent_id,created_at').eq('environment',env).order('created_at',{ascending:false}).limit(200),
      db.from('creator_game_sales').select('id,creator_id,amount_cents,platform_fee_cents,refunded_cents,dispute_open,payout_status,created_at').eq('environment',env).order('created_at',{ascending:false}).limit(200),
      db.from('payouts').select('id,user_id,amount_cents,currency,status,source,reference_number,created_at').eq('environment',env).order('created_at',{ascending:false}).limit(200),
      db.from('subscriptions').select('id,user_id,price_id,status,stripe_subscription_id,current_period_end').eq('environment',env).order('created_at',{ascending:false}).limit(200),
      createStripeClient(env).charges.list({limit:50,...(parsed.data.cursor ? {starting_after:parsed.data.cursor}: {})}),
    ]);
    for(const result of [fx,podcasts,games,payouts,subscriptions]) if(result.error) throw result.error;
    const ids=[...new Set([...(podcasts.data ?? []).map(r=>r.creator_id),...(games.data ?? []).map(r=>r.creator_id),...(payouts.data ?? []).map(r=>r.user_id)])];
    const profiles=ids.length ? await db.from('profiles').select('id,username').in('id',ids) : {data:[],error:null};
    if(profiles.error) throw profiles.error;
    return reply({fx:fx.data,podcasts:podcasts.data,games:games.data,payouts:payouts.data,subscriptions:subscriptions.data,names:Object.fromEntries((profiles.data ?? []).map(r=>[r.id,r.username])),charges:charges.data.map(c=>({id:c.id,description:c.description,amount:c.amount,refunded:c.amount_refunded,currency:c.currency,status:c.status,disputed:c.disputed,created:c.created,paymentIntent:typeof c.payment_intent==='string'?c.payment_intent:null})),hasMore:charges.has_more,nextCursor:charges.data.at(-1)?.id ?? null});
  } catch {return reply({error:'Revenue could not be loaded'},500);}
});