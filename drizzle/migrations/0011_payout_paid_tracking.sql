ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_last4 text,
  ADD COLUMN IF NOT EXISTS marked_paid_by uuid,
  ADD COLUMN IF NOT EXISTS received_confirmed_at timestamptz;

CREATE POLICY "Admins can view all payouts" ON public.payouts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.mark_payout_paid(_payout_id uuid, _reference text, _method text, _bank_name text, _last4 text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can mark payouts paid'; END IF;
  IF coalesce(trim(_reference), '') = '' THEN RAISE EXCEPTION 'Reference number is required'; END IF;
  IF _last4 IS NOT NULL AND _last4 <> '' AND _last4 !~ '^[0-9]{4}$' THEN RAISE EXCEPTION 'Account ending must be 4 digits'; END IF;
  UPDATE public.payouts SET status = 'paid', processed_at = now(), failure_reason = NULL,
    reference_number = trim(_reference), payment_method = nullif(trim(_method), ''),
    bank_name = nullif(trim(_bank_name), ''), account_last4 = nullif(_last4, ''),
    marked_paid_by = auth.uid()
  WHERE id = _payout_id AND status <> 'paid';
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout not found or already paid'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_payout_received(_payout_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.payouts SET received_confirmed_at = now()
  WHERE id = _payout_id AND user_id = auth.uid() AND status = 'paid' AND received_confirmed_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout not found'; END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.mark_payout_paid(uuid,text,text,text,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.confirm_payout_received(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_payout_paid(uuid,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_payout_received(uuid) TO authenticated;