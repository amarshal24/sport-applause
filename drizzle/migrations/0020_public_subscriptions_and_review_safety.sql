CREATE TABLE public.public_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, interests text[] NOT NULL, newsletter_consent boolean NOT NULL DEFAULT false, events_consent boolean NOT NULL DEFAULT false, consent_version text NOT NULL DEFAULT '2026-10-19', consented_at timestamptz NOT NULL DEFAULT now(), unsubscribed_at timestamptz, unsubscribe_hash text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.public_subscriptions TO authenticated;
GRANT ALL ON public.public_subscriptions TO service_role;
ALTER TABLE public.public_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read subscribers" ON public.public_subscriptions FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.subscription_consent_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subscription_id uuid NOT NULL REFERENCES public.public_subscriptions(id) ON DELETE CASCADE, newsletter_consent boolean NOT NULL, events_consent boolean NOT NULL, action text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.subscription_consent_events TO authenticated;
GRANT ALL ON public.subscription_consent_events TO service_role;
ALTER TABLE public.subscription_consent_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read consent history" ON public.subscription_consent_events FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.create_public_subscription(_email text,_interests text[],_newsletter boolean,_events boolean,_hash text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE result uuid; BEGIN
IF length(_email)>255 OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR cardinality(_interests) NOT BETWEEN 1 AND 20 OR NOT (_interests <@ ARRAY['basketball','football','soccer','tennis','baseball','volleyball','swimming','running','cycling','other-sports','media','podcasts','live-events','coaching','fitness','creators']) OR _newsletter IS NULL OR _events IS NULL OR NOT (_newsletter OR _events) OR _hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid subscription'; END IF;
INSERT INTO public.public_subscriptions(email,interests,newsletter_consent,events_consent,unsubscribe_hash) VALUES(lower(trim(_email)),_interests,_newsletter,_events,_hash) ON CONFLICT(email) DO NOTHING RETURNING id INTO result;
IF result IS NOT NULL THEN INSERT INTO public.subscription_consent_events(subscription_id,newsletter_consent,events_consent,action) VALUES(result,_newsletter,_events,'subscribe'); END IF; RETURN result; END $$;
REVOKE ALL ON FUNCTION public.create_public_subscription(text,text[],boolean,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_subscription(text,text[],boolean,boolean,text) TO service_role;
CREATE OR REPLACE FUNCTION public.unsubscribe_public_subscription(_hash text,_scope text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s public.public_subscriptions; BEGIN
IF _scope NOT IN ('all','newsletter','events') THEN RAISE EXCEPTION 'Invalid preference'; END IF;
SELECT * INTO s FROM public.public_subscriptions WHERE unsubscribe_hash=_hash FOR UPDATE;
IF NOT FOUND THEN RETURN false; END IF;
UPDATE public.public_subscriptions SET newsletter_consent=CASE WHEN _scope IN ('all','newsletter') THEN false ELSE newsletter_consent END,events_consent=CASE WHEN _scope IN ('all','events') THEN false ELSE events_consent END WHERE id=s.id RETURNING * INTO s;
UPDATE public.public_subscriptions SET unsubscribed_at=CASE WHEN NOT s.newsletter_consent AND NOT s.events_consent THEN now() ELSE NULL END WHERE id=s.id;
INSERT INTO public.subscription_consent_events(subscription_id,newsletter_consent,events_consent,action) VALUES(s.id,s.newsletter_consent,s.events_consent,'unsubscribe'); RETURN true; END $$;
REVOKE ALL ON FUNCTION public.unsubscribe_public_subscription(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_public_subscription(text,text) TO service_role;
ALTER TABLE public.creator_game_reviews ADD COLUMN hidden_at timestamptz, ADD COLUMN hidden_by uuid;
DROP POLICY "Read reviews of approved games" ON public.creator_game_reviews;
CREATE POLICY "Read visible approved reviews" ON public.creator_game_reviews FOR SELECT TO authenticated USING ((hidden_at IS NULL AND EXISTS(SELECT 1 FROM public.creator_games g WHERE g.id=game_id AND g.status='approved')) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE TABLE public.creator_game_review_reports(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),review_id uuid NOT NULL REFERENCES public.creator_game_reviews(id) ON DELETE CASCADE,reporter_id uuid NOT NULL,reason text NOT NULL,details text NOT NULL DEFAULT '',status text NOT NULL DEFAULT 'pending',created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(review_id,reporter_id));
GRANT SELECT ON public.creator_game_review_reports TO authenticated;
GRANT ALL ON public.creator_game_review_reports TO service_role;
ALTER TABLE public.creator_game_review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Review report access" ON public.creator_game_review_reports FOR SELECT TO authenticated USING(reporter_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE OR REPLACE FUNCTION public.report_creator_game_review(_review_id uuid,_reason text,_details text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF auth.uid() IS NULL OR public.is_suspended(auth.uid()) THEN RAISE EXCEPTION 'Sign in required'; END IF;
IF _reason NOT IN ('Spam','Abusive or hateful content','Bullying or harassment','Other') OR _details IS NULL OR char_length(_details)>2000 THEN RAISE EXCEPTION 'Invalid report'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.creator_game_reviews r JOIN public.creator_games g ON g.id=r.game_id WHERE r.id=_review_id AND r.hidden_at IS NULL AND g.status='approved') THEN RAISE EXCEPTION 'Review unavailable'; END IF;
INSERT INTO public.creator_game_review_reports(review_id,reporter_id,reason,details) VALUES(_review_id,auth.uid(),_reason,btrim(_details)) ON CONFLICT(review_id,reporter_id) DO NOTHING; END $$;
REVOKE ALL ON FUNCTION public.report_creator_game_review(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.report_creator_game_review(uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.moderate_creator_game_review(_report_id uuid,_action text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r public.creator_game_review_reports; BEGIN
IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'Moderator required'; END IF;
IF _action NOT IN ('hide','dismiss') THEN RAISE EXCEPTION 'Invalid action'; END IF;
SELECT * INTO r FROM public.creator_game_review_reports WHERE id=_report_id FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Report missing'; END IF;
IF _action='hide' THEN UPDATE public.creator_game_reviews SET hidden_at=now(),hidden_by=auth.uid() WHERE id=r.review_id; END IF;
UPDATE public.creator_game_review_reports SET status=CASE WHEN _action='hide' THEN 'reviewed' ELSE 'dismissed' END WHERE id=_report_id; END $$;
REVOKE ALL ON FUNCTION public.moderate_creator_game_review(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.moderate_creator_game_review(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_game_review_spam() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF TG_OP='UPDATE' AND NEW.hidden_at IS NOT NULL AND (NEW.rating,NEW.body) IS DISTINCT FROM (OLD.rating,OLD.body) THEN RAISE EXCEPTION 'Moderated review cannot be edited'; END IF;
IF NEW.body ~* '(https?://|www\.)' OR NEW.body ~ '(.)\1{19,}' THEN RAISE EXCEPTION 'Reviews cannot contain links or repeated-character spam'; END IF;
IF EXISTS(SELECT 1 FROM public.creator_game_reviews r WHERE r.buyer_id=NEW.buyer_id AND r.id<>NEW.id AND lower(regexp_replace(btrim(r.body),'\s+',' ','g'))=lower(regexp_replace(btrim(NEW.body),'\s+',' ','g'))) THEN RAISE EXCEPTION 'Write an original review for each game'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER guard_game_review_spam BEFORE INSERT OR UPDATE ON public.creator_game_reviews FOR EACH ROW EXECUTE FUNCTION public.guard_game_review_spam();