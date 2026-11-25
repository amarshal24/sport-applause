-- Newsletter: add the gaming + recruiting categories and a token-based preference update.
--
-- Before: interests were validated against a hard-coded list inside create_public_subscription
-- (no gaming/recruiting) and there was no way to change preferences or re-subscribe: a second
-- submit for an existing email hit ON CONFLICT DO NOTHING and silently dropped the change.
-- Design rule kept: an email address alone NEVER changes an existing subscriber's consent or reveals
-- their link. Updates require the private token that only the subscriber holds (stored hashed).
-- No data is modified by this migration.

CREATE OR REPLACE FUNCTION public.valid_subscription_interests(_interests text[])
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT _interests IS NOT NULL
     AND cardinality(_interests) BETWEEN 1 AND 20
     AND _interests <@ ARRAY[
       'basketball','football','soccer','tennis','baseball','volleyball','swimming','running','cycling','other-sports',
       'media','podcasts','live-events','coaching','fitness','creators','gaming','recruiting'];
$$;
REVOKE ALL ON FUNCTION public.valid_subscription_interests(text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.valid_subscription_interests(text[]) TO service_role;

CREATE OR REPLACE FUNCTION public.create_public_subscription(_email text,_interests text[],_newsletter boolean,_events boolean,_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result uuid;
BEGIN
  IF length(_email) > 255 OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR NOT public.valid_subscription_interests(_interests)
     OR _newsletter IS NULL OR _events IS NULL OR NOT (_newsletter OR _events)
     OR _hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid subscription';
  END IF;
  INSERT INTO public.public_subscriptions(email,interests,newsletter_consent,events_consent,unsubscribe_hash)
  VALUES (lower(trim(_email)),_interests,_newsletter,_events,_hash)
  ON CONFLICT (email) DO NOTHING RETURNING id INTO result;
  IF result IS NOT NULL THEN
    INSERT INTO public.subscription_consent_events(subscription_id,newsletter_consent,events_consent,action)
    VALUES (result,_newsletter,_events,'subscribe');
  END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.create_public_subscription(text,text[],boolean,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_subscription(text,text[],boolean,boolean,text) TO service_role;

-- Preferences for the holder of the private token. Never returns the email address.
CREATE OR REPLACE FUNCTION public.get_public_subscription(_hash text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('interests', interests, 'newsletter', newsletter_consent, 'events', events_consent)
  FROM public.public_subscriptions WHERE unsubscribe_hash = _hash;
$$;
REVOKE ALL ON FUNCTION public.get_public_subscription(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_subscription(text) TO service_role;

-- Update interests and consent (including re-subscribing after an unsubscribe) by token.
-- Every change is appended to the consent history.
CREATE OR REPLACE FUNCTION public.update_public_subscription(_hash text,_interests text[],_newsletter boolean,_events boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.public_subscriptions;
BEGIN
  IF _hash !~ '^[0-9a-f]{64}$' OR NOT public.valid_subscription_interests(_interests)
     OR _newsletter IS NULL OR _events IS NULL OR NOT (_newsletter OR _events) THEN
    RAISE EXCEPTION 'Invalid subscription';
  END IF;
  SELECT * INTO s FROM public.public_subscriptions WHERE unsubscribe_hash = _hash FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.public_subscriptions SET
    interests = _interests,
    newsletter_consent = _newsletter,
    events_consent = _events,
    consented_at = CASE WHEN (_newsletter AND NOT s.newsletter_consent) OR (_events AND NOT s.events_consent) THEN now() ELSE s.consented_at END,
    unsubscribed_at = NULL
  WHERE id = s.id;
  INSERT INTO public.subscription_consent_events(subscription_id,newsletter_consent,events_consent,action)
  VALUES (s.id,_newsletter,_events,'update');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.update_public_subscription(text,text[],boolean,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_public_subscription(text,text[],boolean,boolean) TO service_role;
