ALTER TABLE public.fx_purchases ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE public.fx_purchases ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
CREATE INDEX IF NOT EXISTS fx_purchases_payment_intent_idx ON public.fx_purchases (stripe_payment_intent_id);

CREATE OR REPLACE FUNCTION public.has_fx_access(user_uuid uuid, check_env text DEFAULT 'sandbox'::text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.fx_purchases
    WHERE user_id = user_uuid AND environment = check_env
      AND price_id = 'fx_pro_pack_onetime' AND refunded_at IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid AND environment = check_env
      AND price_id = 'fx_pro_monthly'
      AND (
        (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$function$;
REVOKE EXECUTE ON FUNCTION public.has_fx_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_fx_access(uuid, text) TO authenticated, service_role;