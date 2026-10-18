CREATE OR REPLACE FUNCTION public.refund_creator_game_order(_payment_intent text,_refunded integer,_environment text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.creator_game_orders; refunded integer;
BEGIN
 SELECT * INTO o FROM public.creator_game_orders WHERE payment_intent_id=_payment_intent AND environment=_environment FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 IF _refunded<0 OR _refunded>o.amount_cents THEN RAISE EXCEPTION 'Refund reconciliation mismatch'; END IF;
 refunded:=greatest(o.refunded_cents,_refunded);
 IF refunded=o.refunded_cents THEN RETURN; END IF;
 UPDATE public.creator_game_orders SET refunded_cents=refunded,status=CASE WHEN refunded=amount_cents THEN 'refunded' ELSE status END,reconciled_at=now() WHERE id=o.id;
 UPDATE public.creator_game_sales SET refunded_cents=refunded,creator_net_cents=round((amount_cents-platform_fee_cents)::numeric*(amount_cents-refunded)/amount_cents),reconciled_at=now() WHERE order_id=o.id;
 UPDATE public.payouts SET status='failed',failure_reason='Game refund requires payout reconciliation' WHERE id IN(SELECT payout_id FROM public.creator_game_sales WHERE order_id=o.id) AND status<>'paid';
END $$;
CREATE OR REPLACE FUNCTION public.dispute_creator_game_order(_payment_intent text,_open boolean,_environment text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.creator_game_orders SET status=CASE WHEN _open THEN 'disputed' WHEN refunded_cents=amount_cents THEN 'refunded' ELSE 'paid' END WHERE payment_intent_id=_payment_intent AND environment=_environment;
 UPDATE public.creator_game_sales SET dispute_open=_open WHERE payment_reference=_payment_intent AND environment=_environment AND dispute_open IS DISTINCT FROM _open;
 IF FOUND AND _open THEN
 UPDATE public.payouts SET status='failed',failure_reason='Game dispute requires payout reconciliation' WHERE id IN(SELECT payout_id FROM public.creator_game_sales WHERE payment_reference=_payment_intent AND environment=_environment) AND status<>'paid';
 END IF;
END $$;