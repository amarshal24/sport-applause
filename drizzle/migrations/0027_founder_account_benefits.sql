CREATE OR REPLACE FUNCTION public.get_my_founder_benefits() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS(SELECT 1 FROM auth.users u JOIN public.founding100_applications a ON lower(trim(a.email)) = lower(trim(u.email)) WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL AND a.status = 'selected');
$$;
REVOKE ALL ON FUNCTION public.get_my_founder_benefits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_founder_benefits() TO authenticated;
CREATE OR REPLACE FUNCTION public.has_fx_access(user_uuid uuid, check_env text DEFAULT 'sandbox') RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT (user_uuid = auth.uid() AND public.get_my_founder_benefits()) OR EXISTS (SELECT 1 FROM public.fx_purchases WHERE user_id = user_uuid AND environment = check_env AND price_id = 'fx_pro_pack_onetime' AND refunded_at IS NULL) OR EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = user_uuid AND environment = check_env AND price_id = 'fx_pro_monthly' AND ((status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now())) OR (status = 'canceled' AND current_period_end > now())));
$$;
REVOKE EXECUTE ON FUNCTION public.has_fx_access(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_fx_access(uuid,text) TO authenticated, service_role;