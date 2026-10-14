CREATE OR REPLACE FUNCTION public.enforce_marketplace_listing_rules()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.price IS NULL OR NEW.price < 0 THEN
    RAISE EXCEPTION 'Price must be zero or more';
  END IF;
  -- In-person sales only: no shipping through the app
  NEW.fulfillment := 'pickup';
  NEW.shipping_cost := NULL;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_marketplace_listing_rules ON public.marketplace_listings;
CREATE TRIGGER trg_marketplace_listing_rules
BEFORE INSERT OR UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION public.enforce_marketplace_listing_rules();