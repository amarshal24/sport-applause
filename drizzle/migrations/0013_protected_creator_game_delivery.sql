CREATE TABLE public.creator_game_delivery (
 game_id uuid PRIMARY KEY REFERENCES public.creator_games(id) ON DELETE CASCADE,
 host_key_hash text NOT NULL,
 revision uuid NOT NULL DEFAULT gen_random_uuid(),
 verified_at timestamptz,
 reviewed_at timestamptz,
 reviewed_by uuid,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.creator_game_delivery TO service_role;
ALTER TABLE public.creator_game_delivery ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.creator_game_launch_tokens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 game_id uuid NOT NULL REFERENCES public.creator_games(id) ON DELETE CASCADE,
 buyer_id uuid NOT NULL,
 token_hash text NOT NULL UNIQUE,
 delivery_revision uuid NOT NULL,
 environment text NOT NULL CHECK (environment IN ('sandbox','live')),
 preview boolean NOT NULL DEFAULT true,
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 seconds'),
 consumed_at timestamptz
);
GRANT ALL ON public.creator_game_launch_tokens TO service_role;
ALTER TABLE public.creator_game_launch_tokens ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.configure_creator_game_host(_game_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE secret text := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.creator_games WHERE id = _game_id AND creator_id = auth.uid()) OR public.is_suspended(auth.uid()) THEN RAISE EXCEPTION 'Game owner required'; END IF;
 INSERT INTO public.creator_game_delivery(game_id,host_key_hash) VALUES (_game_id,encode(sha256(convert_to(secret,'UTF8')),'hex'))
 ON CONFLICT (game_id) DO UPDATE SET host_key_hash = EXCLUDED.host_key_hash, revision = gen_random_uuid(), verified_at = NULL, reviewed_at = NULL, reviewed_by = NULL, updated_at = now();
 UPDATE public.creator_games SET status = 'pending' WHERE id = _game_id;
 RETURN secret;
END $$;
REVOKE ALL ON FUNCTION public.configure_creator_game_host(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.configure_creator_game_host(uuid) TO authenticated;
CREATE FUNCTION public.get_creator_game_delivery(_game_id uuid) RETURNS TABLE(configured boolean,verified_at timestamptz,reviewed_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.creator_games WHERE id = _game_id AND (creator_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))) THEN RAISE EXCEPTION 'Owner or reviewer required'; END IF;
 RETURN QUERY SELECT true,d.verified_at,d.reviewed_at FROM public.creator_game_delivery d WHERE d.game_id = _game_id;
END $$;
REVOKE ALL ON FUNCTION public.get_creator_game_delivery(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_game_delivery(uuid) TO authenticated;
CREATE FUNCTION public.review_creator_game_delivery(_game_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'Reviewer access required'; END IF;
 UPDATE public.creator_game_delivery SET reviewed_at = now(), reviewed_by = auth.uid() WHERE game_id = _game_id AND verified_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Complete a protected host preview first'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_creator_game_delivery(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_creator_game_delivery(uuid) TO authenticated;
CREATE FUNCTION public.request_creator_game_launch(_game_id uuid,_environment text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.creator_games; d public.creator_game_delivery; destination text; secret text := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF _environment NOT IN ('sandbox','live') OR _environment IS NULL THEN RAISE EXCEPTION 'Invalid environment'; END IF;
 SELECT * INTO g FROM public.creator_games WHERE id = _game_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Game not found'; END IF;
 IF public.is_suspended(auth.uid()) OR public.is_suspended(g.creator_id) THEN RAISE EXCEPTION 'Game unavailable'; END IF;
 IF g.creator_id <> auth.uid() AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'Paid game sales are not available yet'; END IF;
 IF _environment <> 'sandbox' THEN RAISE EXCEPTION 'Protected previews are test-only'; END IF;
 SELECT * INTO d FROM public.creator_game_delivery WHERE game_id = _game_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Configure protected delivery first'; END IF;
 SELECT launch_url INTO destination FROM public.creator_game_builds WHERE game_id = _game_id;
 IF destination IS NULL THEN RAISE EXCEPTION 'Game URL missing'; END IF;
 INSERT INTO public.creator_game_launch_tokens(game_id,buyer_id,token_hash,delivery_revision,environment,preview) VALUES (_game_id,auth.uid(),encode(sha256(convert_to(secret,'UTF8')),'hex'),d.revision,_environment,true);
 RETURN jsonb_build_object('url',destination,'token',secret,'expires_in',60,'preview',true);
END $$;
REVOKE ALL ON FUNCTION public.request_creator_game_launch(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_creator_game_launch(uuid,text) TO authenticated;
CREATE FUNCTION public.redeem_creator_game_launch(_game_id uuid,_host_key text,_token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.creator_game_delivery; launch public.creator_game_launch_tokens;
BEGIN
 SELECT * INTO d FROM public.creator_game_delivery WHERE game_id = _game_id FOR UPDATE;
 IF NOT FOUND OR d.host_key_hash <> encode(sha256(convert_to(_host_key,'UTF8')),'hex') THEN RAISE EXCEPTION 'Invalid host credentials'; END IF;
 UPDATE public.creator_game_launch_tokens SET consumed_at = now() WHERE game_id = _game_id AND token_hash = encode(sha256(convert_to(_token,'UTF8')),'hex') AND delivery_revision = d.revision AND consumed_at IS NULL AND expires_at > now() RETURNING * INTO launch;
 IF NOT FOUND THEN RAISE EXCEPTION 'Launch authorization invalid or expired'; END IF;
 IF public.is_suspended(launch.buyer_id) OR EXISTS (SELECT 1 FROM public.creator_games WHERE id = _game_id AND public.is_suspended(creator_id)) THEN RAISE EXCEPTION 'Game unavailable'; END IF;
 UPDATE public.creator_game_delivery SET verified_at = now() WHERE game_id = _game_id;
 RETURN jsonb_build_object('game_id',_game_id,'user_id',launch.buyer_id,'environment',launch.environment,'preview',launch.preview);
END $$;
REVOKE ALL ON FUNCTION public.redeem_creator_game_launch(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_creator_game_launch(uuid,text,text) TO service_role;
CREATE FUNCTION public.invalidate_creator_game_delivery() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF (NEW.launch_url,NEW.creator_id) IS DISTINCT FROM (OLD.launch_url,OLD.creator_id) THEN
  IF NEW.creator_id <> OLD.creator_id THEN RAISE EXCEPTION 'Creator cannot change'; END IF;
  UPDATE public.creator_game_delivery SET revision = gen_random_uuid(), verified_at = NULL, reviewed_at = NULL, reviewed_by = NULL, updated_at = now() WHERE game_id = NEW.game_id;
  UPDATE public.creator_games SET status = 'pending' WHERE id = NEW.game_id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER invalidate_game_delivery AFTER UPDATE ON public.creator_game_builds FOR EACH ROW EXECUTE FUNCTION public.invalidate_creator_game_delivery();
CREATE OR REPLACE FUNCTION public.review_creator_game(_game_id uuid,_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'Reviewer access required'; END IF;
 IF _approve AND NOT EXISTS (SELECT 1 FROM public.creator_game_builds WHERE game_id = _game_id) THEN RAISE EXCEPTION 'Game URL required'; END IF;
 IF _approve AND EXISTS (SELECT 1 FROM public.creator_games WHERE id = _game_id AND price_cents > 0) AND NOT EXISTS (SELECT 1 FROM public.creator_game_delivery WHERE game_id = _game_id AND reviewed_at IS NOT NULL) THEN RAISE EXCEPTION 'Protected delivery review required for paid games'; END IF;
 UPDATE public.creator_games SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END WHERE id = _game_id AND status IN ('pending','approved');
 IF NOT FOUND THEN RAISE EXCEPTION 'Game not awaiting review'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.launch_creator_game(_game_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.creator_games; result text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT * INTO g FROM public.creator_games WHERE id = _game_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Game not found'; END IF;
 IF public.is_suspended(auth.uid()) OR public.is_suspended(g.creator_id) THEN RAISE EXCEPTION 'Game unavailable'; END IF;
 IF g.price_cents > 0 THEN RAISE EXCEPTION 'Paid games require protected launch; sales are not available yet'; END IF;
 IF g.creator_id <> auth.uid() AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) AND g.status <> 'approved' THEN RAISE EXCEPTION 'Game unavailable'; END IF;
 SELECT launch_url INTO result FROM public.creator_game_builds WHERE game_id = _game_id;
 IF result IS NULL THEN RAISE EXCEPTION 'Game URL missing'; END IF;
 RETURN result;
END $$;