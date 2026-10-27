import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { createStripeClient } from '../_shared/stripe.ts';
import { settledCheckout } from '../_shared/commerceRules.ts';
import { reconcilePodcastSession } from '../_shared/podcastPayments.ts';
const schema = z.object({ environment: z.enum(['sandbox','live']), sessionId: z.string().regex(/^cs_(test|live)_[a-zA-Z0-9]+$/) }).strict();
Deno.serve(async req => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(req.method === 'OPTIONS') return reply({});
  if(req.method !== 'POST') return reply({error:'Method not allowed'},405);
  try {
    const parsed = schema.safeParse(await req.json());
    if(!parsed.success) return reply({error:'Invalid checkout'},400);
    const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_ANON_KEY');
    if(!url || !key) throw Error('Configuration unavailable');
    const db = createClient(url,key);
    const {data,error} = await db.auth.getUser(req.headers.get('Authorization')?.replace(/^Bearer /,'') ?? '');
    if(error || !data.user) return reply({error:'Sign in required'},401);
    const session = await createStripeClient(parsed.data.environment).checkout.sessions.retrieve(parsed.data.sessionId);
    if(session.metadata?.userId !== data.user.id) return reply({error:'Checkout not found'},404);
    if(session.metadata?.kind?.startsWith('podcast_')) {
      const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if(!serviceKey) throw Error('Configuration unavailable');
      const result=await reconcilePodcastSession(createClient(url,serviceKey),session.id,parsed.data.environment);
      let access=result.ready;
      if(result.kind==='podcast_membership') {
        const membership=await db.from('creator_memberships').select('status,current_period_end').eq('fan_id',data.user.id).eq('creator_id',session.metadata.creatorId).eq('environment',parsed.data.environment).eq('stripe_subscription_id',typeof session.subscription==='string'?session.subscription:session.subscription?.id ?? '').maybeSingle();
        if(membership.error) throw membership.error;
        const m=membership.data;
        access=!!m && ((['active','trialing','past_due'].includes(m.status) && (!m.current_period_end || new Date(m.current_period_end)>new Date())) || (m.status==='canceled' && !!m.current_period_end && new Date(m.current_period_end)>new Date()));
      }
      return reply({settled:settledCheckout(session.payment_status),ready:access,refunded:result.refunded??false,status:session.status,kind:result.kind,amount:session.amount_total,currency:session.currency});
    }
    return reply({settled:settledCheckout(session.payment_status),status:session.status,kind:session.metadata?.kind ?? null,priceId:session.metadata?.priceId ?? null});
  } catch {return reply({error:'Unable to confirm payment'},400);}
});