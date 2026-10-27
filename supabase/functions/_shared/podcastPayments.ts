import { createClient } from 'npm:@supabase/supabase-js@2';
import { createStripeClient, type StripeEnv } from './stripe.ts';
import { settledCheckout } from './commerceRules.ts';
export async function podcastInvoiceIntent(stripe: ReturnType<typeof createStripeClient>, invoiceId: string) {
  const payments = await stripe.invoicePayments.list({invoice:invoiceId,limit:100});
  const payment = payments.data.find(p=>p.status==='paid' && p.payment.type==='payment_intent');
  const intent = payment?.payment.payment_intent;
  return typeof intent === 'string' ? intent : intent?.id ?? null;
}
export async function reconcilePodcastSession(db:ReturnType<typeof createClient>, sessionId:string, env:StripeEnv) {
  const stripe=createStripeClient(env);
  const session=await stripe.checkout.sessions.retrieve(sessionId);
  const md=session.metadata??{};
  if(!['podcast_unlock','podcast_membership','podcast_tip'].includes(md.kind??'') || !md.userId || !md.creatorId) throw Error('Invalid podcast checkout');
  if(!settledCheckout(session.payment_status)) return {ready:false,kind:md.kind};
  const subId=typeof session.subscription==='string'?session.subscription:session.subscription?.id;
  if(subId) {
    const sub=await stripe.subscriptions.retrieve(subId);
    const end=sub.items.data[0]?.current_period_end;
    const saved=await db.from('creator_memberships').upsert({fan_id:md.userId,creator_id:md.creatorId,stripe_subscription_id:sub.id,stripe_customer_id:typeof sub.customer==='string'?sub.customer:sub.customer.id,status:sub.status,current_period_end:end?new Date(end*1000).toISOString():null,cancel_at_period_end:sub.cancel_at_period_end,price_cents:Number(md.amountCents),environment:env,updated_at:new Date().toISOString()},{onConflict:'stripe_subscription_id'});
    if(saved.error) throw saved.error;
  }
  const invoiceId=typeof session.invoice==='string'?session.invoice:session.invoice?.id;
  const pi=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id ?? (invoiceId?await podcastInvoiceIntent(stripe,invoiceId):null);
  let refunded=0;
  if(pi){const intent=await stripe.paymentIntents.retrieve(pi,{expand:['latest_charge']});if(intent.latest_charge && typeof intent.latest_charge!=='string')refunded=intent.latest_charge.amount_refunded;}
  const saved=await db.from('podcast_payments').upsert({payer_id:md.userId,creator_id:md.creatorId,podcast_id:md.podcastId??null,kind:md.kind.replace('podcast_',''),amount_cents:Number(md.amountCents),platform_fee_cents:Number(md.platformFeeCents),creator_net_cents:Number(md.creatorNetCents),stripe_session_id:session.id,stripe_payment_intent_id:pi,stripe_subscription_id:subId??null,environment:env,refunded_cents:refunded,refunded_at:refunded?new Date().toISOString():null},{onConflict:'stripe_session_id'});
  if(saved.error) throw saved.error;
  const amount=Number(md.amountCents);
  return {ready:refunded<amount,kind:md.kind,refunded:refunded>=amount};
}