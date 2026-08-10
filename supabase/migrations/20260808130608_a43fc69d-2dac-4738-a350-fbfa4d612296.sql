DROP POLICY IF EXISTS "Signed-in users can view creator pricing" ON public.creator_payouts;

CREATE OR REPLACE VIEW public.creator_pricing_public
WITH (security_invoker = off) AS
SELECT user_id, tips_enabled, membership_enabled, membership_price_cents
FROM public.creator_payouts;

GRANT SELECT ON public.creator_pricing_public TO authenticated;
GRANT SELECT ON public.creator_pricing_public TO anon;