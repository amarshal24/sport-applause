ALTER TABLE public.podcast_payments
  ADD COLUMN IF NOT EXISTS refunded_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
CREATE INDEX IF NOT EXISTS podcast_payments_pi_idx ON public.podcast_payments(stripe_payment_intent_id);