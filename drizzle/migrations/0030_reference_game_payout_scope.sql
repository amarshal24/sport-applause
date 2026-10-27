CREATE OR REPLACE FUNCTION public.allocate_reference_game_payout(_run_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.game_test_runs; payout uuid; owed integer;
BEGIN
SELECT * INTO r FROM public.game_test_runs WHERE id=_run_id AND closed_at IS NULL FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Test run unavailable'; END IF;
PERFORM 1 FROM public.creator_game_sales WHERE game_id=r.game_id FOR UPDATE;
SELECT sum(creator_net_cents)::integer INTO owed FROM public.creator_game_sales WHERE game_id=r.game_id AND environment='sandbox' AND payout_id IS NULL AND reconciled_at IS NOT NULL AND NOT dispute_open AND creator_net_cents>0;
IF coalesce(owed,0)<=0 THEN RAISE EXCEPTION 'No eligible test earnings'; END IF;
INSERT INTO public.payouts(user_id,amount_cents,environment,status,scheduled_for,source) VALUES(r.creator_id,owed,'sandbox','scheduled',current_date,'creator_game') RETURNING id INTO payout;
UPDATE public.creator_game_sales SET payout_id=payout,payout_status='scheduled' WHERE game_id=r.game_id AND environment='sandbox' AND payout_id IS NULL AND reconciled_at IS NOT NULL AND NOT dispute_open AND creator_net_cents>0;
RETURN payout;
END $$;
REVOKE ALL ON FUNCTION public.allocate_reference_game_payout(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_reference_game_payout(uuid) TO service_role;
COMMENT ON FUNCTION public.allocate_reference_game_payout(uuid) IS 'Service-only isolated test-run payout allocation, no transfer and no unrelated creator sales.';