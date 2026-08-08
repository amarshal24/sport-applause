DROP VIEW IF EXISTS public.creator_pricing_public;

CREATE OR REPLACE FUNCTION public.get_creator_pricing(_creator_ids uuid[])
RETURNS TABLE(user_id uuid, tips_enabled boolean, membership_enabled boolean, membership_price_cents integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.user_id, cp.tips_enabled, cp.membership_enabled, cp.membership_price_cents
  FROM public.creator_payouts cp
  WHERE cp.user_id = ANY(_creator_ids);
$$;

REVOKE ALL ON FUNCTION public.get_creator_pricing(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_creator_pricing(uuid[]) TO authenticated;