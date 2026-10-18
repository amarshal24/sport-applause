ALTER TABLE public.payouts ADD COLUMN source text NOT NULL DEFAULT 'podcast';
CREATE FUNCTION public.schedule_creator_game_test_payout(_creator_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE payout uuid; owed integer;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('game-payout-'||_creator_id::text,0));
 SELECT sum(creator_net_cents)::integer INTO owed FROM public.creator_game_sales WHERE creator_id=_creator_id AND environment='sandbox' AND payout_id IS NULL AND reconciled_at IS NOT NULL AND NOT dispute_open AND creator_net_cents>0;
 IF coalesce(owed,0)<=0 THEN RAISE EXCEPTION 'No reconciled test game earnings available'; END IF;
 INSERT INTO public.payouts(user_id,amount_cents,environment,status,scheduled_for,source) VALUES(_creator_id,owed,'sandbox','scheduled',current_date,'creator_game') RETURNING id INTO payout;
 UPDATE public.creator_game_sales SET payout_id=payout,payout_status='scheduled' WHERE creator_id=_creator_id AND environment='sandbox' AND payout_id IS NULL AND reconciled_at IS NOT NULL AND NOT dispute_open AND creator_net_cents>0;
 RETURN payout;
END $$;
REVOKE ALL ON FUNCTION public.schedule_creator_game_test_payout(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_creator_game_test_payout(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.mark_payout_paid(_payout_id uuid,_reference text,_method text,_bank_name text,_last4 text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.payouts; net integer;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only admins can mark payouts paid'; END IF;
 IF coalesce(trim(_reference),'')='' THEN RAISE EXCEPTION 'Reference number is required'; END IF;
 IF _last4 IS NOT NULL AND _last4<>'' AND _last4 !~ '^[0-9]{4}$' THEN RAISE EXCEPTION 'Account ending must be 4 digits'; END IF;
 SELECT * INTO p FROM public.payouts WHERE id=_payout_id FOR UPDATE;
 IF NOT FOUND OR p.status='paid' THEN RAISE EXCEPTION 'Payout not found or already paid'; END IF;
 IF p.source='creator_game' THEN
  IF p.environment<>'sandbox' OR p.status<>'scheduled' THEN RAISE EXCEPTION 'Game payout not ready'; END IF;
  PERFORM 1 FROM public.creator_game_sales WHERE payout_id=p.id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.creator_game_sales WHERE payout_id=p.id AND (dispute_open OR reconciled_at IS NULL OR environment<>p.environment)) THEN RAISE EXCEPTION 'Game payout requires reconciliation'; END IF;
  SELECT sum(creator_net_cents)::integer INTO net FROM public.creator_game_sales WHERE payout_id=p.id;
  IF net IS DISTINCT FROM p.amount_cents THEN RAISE EXCEPTION 'Game payout balance changed'; END IF;
 END IF;
 UPDATE public.payouts SET status='paid',processed_at=now(),failure_reason=NULL,reference_number=trim(_reference),payment_method=nullif(trim(_method),''),bank_name=nullif(trim(_bank_name),''),account_last4=nullif(_last4,''),marked_paid_by=auth.uid() WHERE id=p.id;
 UPDATE public.creator_game_sales SET payout_status='paid' WHERE payout_id=p.id;
END $$;