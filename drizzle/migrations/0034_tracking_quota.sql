-- AI tracked-clip quota ledger.
--
-- Each AI-tracked clip costs real GPU money, so every package gets an allowance. This ledger is the
-- single source of truth. Limits are NOT stored here: the server-side function that starts a tracking
-- job computes the caller's limits from verified entitlements and passes them in, so a client can
-- never raise its own limit. All writes go through service-role-only functions (never direct table
-- access), and a per-user advisory lock makes consume/refund safe under concurrent requests.
--
--   monthly bucket  : counts clips in the current UTC calendar month; resets automatically
--   lifetime bucket : counts clips that never reset (used for the one-time pack bonus)
-- A clip is taken from the monthly bucket first, then the lifetime bucket.
-- Failed jobs are refunded (refunded_at) so a user is never charged a slot for a clip that failed.

CREATE TABLE IF NOT EXISTS public.tracking_usage (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id       text NOT NULL CHECK (length(job_id) BETWEEN 1 AND 128),
  source       text NOT NULL CHECK (source IN ('monthly', 'lifetime')),
  period_start date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  refunded_at  timestamptz,
  UNIQUE (user_id, job_id)
);
CREATE INDEX IF NOT EXISTS tracking_usage_user_period_idx ON public.tracking_usage (user_id, period_start);

ALTER TABLE public.tracking_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tracking_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.tracking_usage TO authenticated;
DROP POLICY IF EXISTS "Users read own tracking usage" ON public.tracking_usage;
CREATE POLICY "Users read own tracking usage" ON public.tracking_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_tracking_clip(p_user uuid, p_job text, p_monthly integer, p_lifetime integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period date := (date_trunc('month', now() AT TIME ZONE 'utc'))::date;
  _existing public.tracking_usage%ROWTYPE;
  _had boolean; _m integer; _l integer; _source text;
BEGIN
  IF p_user IS NULL OR p_job IS NULL OR p_monthly IS NULL OR p_lifetime IS NULL OR p_monthly < 0 OR p_lifetime < 0 THEN
    RAISE EXCEPTION 'TRACKING_QUOTA_BAD_ARGUMENTS' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('tracking_quota:' || p_user::text));

  SELECT * INTO _existing FROM public.tracking_usage WHERE user_id = p_user AND job_id = p_job;
  _had := FOUND;
  -- Same job submitted twice (retry/double click) must not use a second slot.
  IF _had AND _existing.refunded_at IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'duplicate', true, 'source', _existing.source);
  END IF;

  SELECT count(*) FILTER (WHERE source = 'monthly' AND period_start = _period),
         count(*) FILTER (WHERE source = 'lifetime')
    INTO _m, _l
  FROM public.tracking_usage WHERE user_id = p_user AND refunded_at IS NULL;

  IF _m < p_monthly THEN _source := 'monthly';
  ELSIF _l < p_lifetime THEN _source := 'lifetime';
  ELSE
    RETURN jsonb_build_object('allowed', false, 'reason', 'TRACKING_QUOTA_EXHAUSTED',
      'monthly_used', _m, 'monthly_limit', p_monthly, 'lifetime_used', _l, 'lifetime_limit', p_lifetime);
  END IF;

  IF _had THEN -- a refunded attempt being retried under the same job id
    UPDATE public.tracking_usage SET source = _source, period_start = _period, created_at = now(), refunded_at = NULL
     WHERE id = _existing.id;
  ELSE
    INSERT INTO public.tracking_usage (user_id, job_id, source, period_start) VALUES (p_user, p_job, _source, _period);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'duplicate', false, 'source', _source,
    'monthly_used', _m + (CASE WHEN _source = 'monthly' THEN 1 ELSE 0 END), 'monthly_limit', p_monthly,
    'lifetime_used', _l + (CASE WHEN _source = 'lifetime' THEN 1 ELSE 0 END), 'lifetime_limit', p_lifetime);
END;
$$;

-- Give the slot back when a job fails or is cancelled before producing a result. Idempotent.
CREATE OR REPLACE FUNCTION public.refund_tracking_clip(p_user uuid, p_job text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('tracking_quota:' || p_user::text));
  UPDATE public.tracking_usage SET refunded_at = now()
   WHERE user_id = p_user AND job_id = p_job AND refunded_at IS NULL;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n > 0;
END;
$$;

-- Self-only usage read for the UI. Limits are computed server-side from entitlements, never here.
CREATE OR REPLACE FUNCTION public.get_my_tracking_usage()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'monthly_used', count(*) FILTER (WHERE source = 'monthly' AND period_start = (date_trunc('month', now() AT TIME ZONE 'utc'))::date),
    'lifetime_used', count(*) FILTER (WHERE source = 'lifetime'))
  FROM public.tracking_usage WHERE user_id = auth.uid() AND refunded_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.consume_tracking_clip(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_tracking_clip(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_tracking_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_tracking_clip(uuid, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_tracking_clip(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_tracking_usage() TO authenticated;
