CREATE TABLE public.game_test_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), admin_id uuid NOT NULL, game_id uuid NOT NULL UNIQUE REFERENCES public.creator_games(id), creator_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), closed_at timestamptz);
GRANT SELECT ON public.game_test_runs TO authenticated; GRANT ALL ON public.game_test_runs TO service_role;
ALTER TABLE public.game_test_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own game test runs" ON public.game_test_runs FOR SELECT TO authenticated USING (admin_id=auth.uid() AND public.has_role(auth.uid(),'admin'));
CREATE TABLE public.game_test_host_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES public.game_test_runs(id), user_id uuid NOT NULL, delivery_revision uuid NOT NULL, preview boolean NOT NULL, secret_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes');
GRANT ALL ON public.game_test_host_sessions TO service_role;
ALTER TABLE public.game_test_host_sessions ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.begin_reference_host_session(_run_id uuid,_token text,_session_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.game_test_runs; d public.creator_game_delivery; l public.creator_game_launch_tokens; sid uuid;
BEGIN
SELECT * INTO r FROM public.game_test_runs WHERE id=_run_id AND closed_at IS NULL;
IF NOT FOUND OR _session_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid test run'; END IF;
SELECT * INTO d FROM public.creator_game_delivery WHERE game_id=r.game_id FOR UPDATE;
UPDATE public.creator_game_launch_tokens SET consumed_at=now() WHERE game_id=r.game_id AND buyer_id=r.admin_id AND environment='sandbox' AND delivery_revision=d.revision AND token_hash=encode(sha256(convert_to(_token,'UTF8')),'hex') AND consumed_at IS NULL AND expires_at>now() RETURNING * INTO l;
IF NOT FOUND OR public.is_suspended(l.buyer_id) OR public.is_suspended(r.creator_id) THEN RAISE EXCEPTION 'Launch invalid or expired'; END IF;
IF NOT l.preview AND NOT EXISTS(SELECT 1 FROM public.creator_game_orders WHERE game_id=r.game_id AND buyer_id=l.buyer_id AND environment='sandbox' AND status='paid' AND refunded_cents<amount_cents AND delivery_revision=d.revision AND settled_at IS NOT NULL AND reconciled_at IS NOT NULL) THEN RAISE EXCEPTION 'Purchase required'; END IF;
INSERT INTO public.game_test_host_sessions(run_id,user_id,delivery_revision,preview,secret_hash) VALUES(r.id,l.buyer_id,d.revision,l.preview,_session_hash) RETURNING id INTO sid;
UPDATE public.creator_game_delivery SET verified_at=now() WHERE game_id=r.game_id;
RETURN jsonb_build_object('session_id',sid,'preview',l.preview,'environment','sandbox');
END $$;
REVOKE ALL ON FUNCTION public.begin_reference_host_session(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_reference_host_session(uuid,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.check_reference_host_session(_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.game_test_host_sessions; r public.game_test_runs; d public.creator_game_delivery;
BEGIN
SELECT * INTO s FROM public.game_test_host_sessions WHERE secret_hash=_hash AND expires_at>now();
IF NOT FOUND THEN RETURN NULL; END IF;
SELECT * INTO r FROM public.game_test_runs WHERE id=s.run_id AND closed_at IS NULL;
IF NOT FOUND OR public.is_suspended(s.user_id) OR public.is_suspended(r.creator_id) THEN RETURN NULL; END IF;
SELECT * INTO d FROM public.creator_game_delivery WHERE game_id=r.game_id;
IF NOT FOUND OR d.revision<>s.delivery_revision THEN RETURN NULL; END IF;
IF s.preview THEN IF s.user_id<>r.admin_id OR NOT public.has_role(s.user_id,'admin') THEN RETURN NULL; END IF;
ELSIF NOT EXISTS(SELECT 1 FROM public.creator_games g JOIN public.creator_game_orders o ON o.game_id=g.id WHERE g.id=r.game_id AND g.status='approved' AND d.reviewed_at IS NOT NULL AND o.buyer_id=s.user_id AND o.environment='sandbox' AND o.status='paid' AND o.refunded_cents<o.amount_cents AND o.delivery_revision=d.revision AND o.settled_at IS NOT NULL AND o.reconciled_at IS NOT NULL) THEN RETURN NULL; END IF;
RETURN jsonb_build_object('authorized',true,'run_id',r.id,'game_id',r.game_id,'preview',s.preview,'environment','sandbox');
END $$;
REVOKE ALL ON FUNCTION public.check_reference_host_session(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.check_reference_host_session(text) TO service_role;
COMMENT ON TABLE public.game_test_runs IS 'Isolated admin sandbox reference host runs, never production delivery approval or real payouts.';