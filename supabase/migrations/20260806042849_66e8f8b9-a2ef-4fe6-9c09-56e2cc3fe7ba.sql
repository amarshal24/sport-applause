ALTER TABLE public.podcasts
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_price_cents integer NOT NULL DEFAULT 299,
  ADD COLUMN IF NOT EXISTS tips_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.creator_payouts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_email text,
  payout_country text,
  tips_enabled boolean NOT NULL DEFAULT true,
  membership_enabled boolean NOT NULL DEFAULT false,
  membership_price_cents integer NOT NULL DEFAULT 499,
  payout_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_payouts TO authenticated;
GRANT ALL ON public.creator_payouts TO service_role;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own payout settings"
  ON public.creator_payouts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Signed-in users can view creator pricing"
  ON public.creator_payouts FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_creator_payouts_updated_at
  BEFORE UPDATE ON public.creator_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.podcast_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  podcast_id uuid REFERENCES public.podcasts(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('tip','unlock','membership')),
  amount_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  creator_net_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  stripe_session_id text UNIQUE,
  stripe_subscription_id text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_podcast_payments_creator ON public.podcast_payments(creator_id);
CREATE INDEX IF NOT EXISTS idx_podcast_payments_payer ON public.podcast_payments(payer_id);

GRANT SELECT ON public.podcast_payments TO authenticated;
GRANT ALL ON public.podcast_payments TO service_role;
ALTER TABLE public.podcast_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payers view own payments"
  ON public.podcast_payments FOR SELECT TO authenticated
  USING (auth.uid() = payer_id);

CREATE POLICY "Creators view payments to them"
  ON public.podcast_payments FOR SELECT TO authenticated
  USING (auth.uid() = creator_id);

CREATE TABLE IF NOT EXISTS public.creator_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  price_cents integer NOT NULL DEFAULT 0,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_memberships_fan ON public.creator_memberships(fan_id);
CREATE INDEX IF NOT EXISTS idx_creator_memberships_creator ON public.creator_memberships(creator_id);

GRANT SELECT ON public.creator_memberships TO authenticated;
GRANT ALL ON public.creator_memberships TO service_role;
ALTER TABLE public.creator_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fans view own memberships"
  ON public.creator_memberships FOR SELECT TO authenticated
  USING (auth.uid() = fan_id);

CREATE POLICY "Creators view their members"
  ON public.creator_memberships FOR SELECT TO authenticated
  USING (auth.uid() = creator_id);

CREATE TRIGGER update_creator_memberships_updated_at
  BEFORE UPDATE ON public.creator_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_podcast_access(_user_id uuid, _podcast_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.podcasts p
    WHERE p.id = _podcast_id
      AND (p.is_premium = false OR p.user_id = _user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.podcast_payments pay
    WHERE pay.podcast_id = _podcast_id
      AND pay.payer_id = _user_id
      AND pay.kind = 'unlock'
  )
  OR EXISTS (
    SELECT 1 FROM public.creator_memberships m
    JOIN public.podcasts p2 ON p2.id = _podcast_id
    WHERE m.fan_id = _user_id
      AND m.creator_id = p2.user_id
      AND m.status IN ('active','trialing','past_due')
      AND (m.current_period_end IS NULL OR m.current_period_end > now())
  );
$$;