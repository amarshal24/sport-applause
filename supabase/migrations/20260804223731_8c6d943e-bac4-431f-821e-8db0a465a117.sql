ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS team text,
  ADD COLUMN IF NOT EXISTS league text,
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS fulfillment text NOT NULL DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS shipping_cost numeric;