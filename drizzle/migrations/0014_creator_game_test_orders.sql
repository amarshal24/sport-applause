CREATE TABLE public.creator_game_sale_controls (
 game_id uuid PRIMARY KEY REFERENCES public.creator_games(id) ON DELETE CASCADE,
 test_sales_enabled boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.creator_game_sale_controls TO service_role;
ALTER TABLE public.creator_game_sale_controls ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.creator_game_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), game_id uuid NOT NULL REFERENCES public.creator_games(id), buyer_id uuid NOT NULL, creator_id uuid NOT NULL,
 title text NOT NULL, amount_cents integer NOT NULL CHECK(amount_cents BETWEEN 50 AND 100000), platform_fee_cents integer NOT NULL CHECK(platform_fee_cents BETWEEN 0 AND amount_cents),
 currency text NOT NULL DEFAULT 'usd' CHECK(currency = 'usd'), environment text NOT NULL CHECK(environment IN ('sandbox','live')),
 delivery_revision uuid NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded','disputed')),
 stripe_session_id text UNIQUE, payment_intent_id text UNIQUE, refunded_cents integer NOT NULL DEFAULT 0 CHECK(refunded_cents BETWEEN 0 AND amount_cents),
 created_at timestamptz NOT NULL DEFAULT now(), settled_at timestamptz, reconciled_at timestamptz
);
GRANT SELECT ON public.creator_game_orders TO authenticated;
GRANT ALL ON public.creator_game_orders TO service_role;
ALTER TABLE public.creator_game_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers read own game orders" ON public.creator_game_orders FOR SELECT TO authenticated USING(buyer_id = auth.uid());
ALTER TABLE public.creator_game_sales ADD COLUMN order_id uuid UNIQUE REFERENCES public.creator_game_orders(id), ADD COLUMN reconciled_at timestamptz, ADD COLUMN dispute_open boolean NOT NULL DEFAULT false, ADD COLUMN payout_id uuid REFERENCES public.payouts(id);
CREATE FUNCTION public.begin_creator_game_order(_game_id uuid,_buyer_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.creator_games; d public.creator_game_delivery; o public.creator_game_orders;
BEGIN
 IF NOT public.has_role(_buyer_id,'admin') THEN RAISE EXCEPTION 'Restricted test purchases only'; END IF;
 SELECT * INTO g FROM public.creator_games WHERE id = _game_id FOR UPDATE;
 IF NOT FOUND OR g.status <> 'approved' OR g.price_cents < 50 OR g.creator_id = _buyer_id OR public.is_suspended(g.creator_id) OR public.is_suspended(_buyer_id) THEN RAISE EXCEPTION 'Game unavailable for purchase'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.creator_game_sale_controls WHERE game_id = _game_id AND test_sales_enabled) THEN RAISE EXCEPTION 'Test sales not enabled for this game'; END IF;
 SELECT * INTO d FROM public.creator_game_delivery WHERE game_id = _game_id AND reviewed_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Protected delivery review required'; END IF;
 IF EXISTS(SELECT 1 FROM public.creator_game_orders WHERE game_id = _game_id AND buyer_id = _buyer_id AND environment = 'sandbox' AND status = 'paid' AND refunded_cents < amount_cents) THEN RAISE EXCEPTION 'Game already purchased'; END IF;
 INSERT INTO public.creator_game_orders(game_id,buyer_id,creator_id,title,amount_cents,platform_fee_cents,environment,delivery_revision) VALUES(g.id,_buyer_id,g.creator_id,g.title,g.price_cents,round(g.price_cents * 0.15),'sandbox',d.revision) RETURNING * INTO o;
 RETURN to_jsonb(o);
END $$;
REVOKE ALL ON FUNCTION public.begin_creator_game_order(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_creator_game_order(uuid,uuid) TO service_role;
CREATE FUNCTION public.settle_creator_game_order(_order_id uuid,_session_id text,_payment_intent text,_amount integer,_currency text,_environment text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.creator_game_orders;
BEGIN
 SELECT * INTO o FROM public.creator_game_orders WHERE id = _order_id FOR UPDATE;
 IF NOT FOUND OR o.environment <> _environment OR o.stripe_session_id IS DISTINCT FROM _session_id OR o.amount_cents <> _amount OR o.currency <> _currency OR coalesce(_payment_intent,'') = '' THEN RAISE EXCEPTION 'Game payment reconciliation mismatch'; END IF;
 IF o.status IN ('refunded','disputed') THEN RETURN; END IF;
 INSERT INTO public.creator_game_sales(game_id,creator_id,buyer_id,amount_cents,platform_fee_cents,creator_net_cents,currency,environment,payment_reference,order_id,reconciled_at) VALUES(o.game_id,o.creator_id,o.buyer_id,o.amount_cents,o.platform_fee_cents,o.amount_cents-o.platform_fee_cents,o.currency,o.environment,_payment_intent,o.id,now()) ON CONFLICT(order_id) DO NOTHING;
 UPDATE public.creator_game_orders SET status = 'paid', payment_intent_id = _payment_intent, settled_at = coalesce(settled_at,now()), reconciled_at = now() WHERE id = o.id;
END $$;
REVOKE ALL ON FUNCTION public.settle_creator_game_order(uuid,text,text,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.settle_creator_game_order(uuid,text,text,integer,text,text) TO service_role;
CREATE FUNCTION public.refund_creator_game_order(_payment_intent text,_refunded integer,_environment text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.creator_game_orders; refunded integer;
BEGIN
 SELECT * INTO o FROM public.creator_game_orders WHERE payment_intent_id = _payment_intent AND environment = _environment FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 IF _refunded < 0 OR _refunded > o.amount_cents THEN RAISE EXCEPTION 'Refund reconciliation mismatch'; END IF;
 refunded := greatest(o.refunded_cents,_refunded);
 UPDATE public.creator_game_orders SET refunded_cents = refunded, status = CASE WHEN refunded = amount_cents THEN 'refunded' ELSE status END, reconciled_at = now() WHERE id = o.id;
 UPDATE public.creator_game_sales SET refunded_cents = refunded, creator_net_cents = round((amount_cents-platform_fee_cents)::numeric*(amount_cents-refunded)/amount_cents), reconciled_at = now() WHERE order_id = o.id;
 UPDATE public.payouts SET status = 'failed',failure_reason = 'Game refund requires payout reconciliation' WHERE id IN(SELECT payout_id FROM public.creator_game_sales WHERE order_id=o.id) AND status <> 'paid';
END $$;
REVOKE ALL ON FUNCTION public.refund_creator_game_order(text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refund_creator_game_order(text,integer,text) TO service_role;
CREATE FUNCTION public.dispute_creator_game_order(_payment_intent text,_open boolean,_environment text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.creator_game_orders SET status = CASE WHEN _open THEN 'disputed' WHEN refunded_cents = amount_cents THEN 'refunded' ELSE 'paid' END WHERE payment_intent_id=_payment_intent AND environment=_environment;
 UPDATE public.creator_game_sales SET dispute_open=_open WHERE payment_reference=_payment_intent AND environment=_environment;
 UPDATE public.payouts SET status='failed',failure_reason='Game dispute requires payout reconciliation' WHERE _open AND id IN(SELECT payout_id FROM public.creator_game_sales WHERE payment_reference=_payment_intent AND environment=_environment) AND status <> 'paid';
END $$;
REVOKE ALL ON FUNCTION public.dispute_creator_game_order(text,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispute_creator_game_order(text,boolean,text) TO service_role;
CREATE FUNCTION public.can_purchase_creator_game_test(_game_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.creator_game_sale_controls c JOIN public.creator_games g ON g.id=c.game_id JOIN public.creator_game_delivery d ON d.game_id=g.id WHERE g.id=_game_id AND c.test_sales_enabled AND g.status='approved' AND d.reviewed_at IS NOT NULL AND g.creator_id <> auth.uid()); $$;
REVOKE ALL ON FUNCTION public.can_purchase_creator_game_test(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_purchase_creator_game_test(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.request_creator_game_launch(_game_id uuid,_environment text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.creator_games; d public.creator_game_delivery; destination text; preview_mode boolean; secret text := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF _environment IS DISTINCT FROM 'sandbox' THEN RAISE EXCEPTION 'Live game sales are not available yet'; END IF;
 SELECT * INTO g FROM public.creator_games WHERE id=_game_id;
 IF NOT FOUND OR public.is_suspended(auth.uid()) OR public.is_suspended(g.creator_id) THEN RAISE EXCEPTION 'Game unavailable'; END IF;
 SELECT * INTO d FROM public.creator_game_delivery WHERE game_id=_game_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Configure protected delivery first'; END IF;
 preview_mode := g.creator_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator');
 IF EXISTS(SELECT 1 FROM public.creator_game_orders WHERE game_id=_game_id AND buyer_id=auth.uid() AND environment=_environment AND status='paid' AND refunded_cents<amount_cents AND delivery_revision=d.revision) THEN preview_mode:=false;
 ELSIF NOT preview_mode THEN RAISE EXCEPTION 'Purchase required'; END IF;
 IF NOT preview_mode AND (g.status <> 'approved' OR d.reviewed_at IS NULL) THEN RAISE EXCEPTION 'Delivery review required'; END IF;
 SELECT launch_url INTO destination FROM public.creator_game_builds WHERE game_id=_game_id;
 IF destination IS NULL THEN RAISE EXCEPTION 'Game URL missing'; END IF;
 INSERT INTO public.creator_game_launch_tokens(game_id,buyer_id,token_hash,delivery_revision,environment,preview) VALUES(_game_id,auth.uid(),encode(sha256(convert_to(secret,'UTF8')),'hex'),d.revision,_environment,preview_mode);
 RETURN jsonb_build_object('url',destination,'token',secret,'expires_in',60,'preview',preview_mode);
END $$;
CREATE OR REPLACE FUNCTION public.redeem_creator_game_launch(_game_id uuid,_host_key text,_token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.creator_game_delivery; launch public.creator_game_launch_tokens;
BEGIN
 SELECT * INTO d FROM public.creator_game_delivery WHERE game_id=_game_id FOR UPDATE;
 IF NOT FOUND OR d.host_key_hash<>encode(sha256(convert_to(_host_key,'UTF8')),'hex') THEN RAISE EXCEPTION 'Invalid host credentials'; END IF;
 UPDATE public.creator_game_launch_tokens SET consumed_at=now() WHERE game_id=_game_id AND token_hash=encode(sha256(convert_to(_token,'UTF8')),'hex') AND delivery_revision=d.revision AND consumed_at IS NULL AND expires_at>now() RETURNING * INTO launch;
 IF NOT FOUND THEN RAISE EXCEPTION 'Launch authorization invalid or expired'; END IF;
 IF public.is_suspended(launch.buyer_id) OR EXISTS(SELECT 1 FROM public.creator_games WHERE id=_game_id AND public.is_suspended(creator_id)) THEN RAISE EXCEPTION 'Game unavailable'; END IF;
 IF NOT launch.preview AND NOT EXISTS(SELECT 1 FROM public.creator_game_orders WHERE game_id=_game_id AND buyer_id=launch.buyer_id AND environment=launch.environment AND status='paid' AND refunded_cents<amount_cents AND delivery_revision=d.revision) THEN RAISE EXCEPTION 'Purchase access revoked'; END IF;
 UPDATE public.creator_game_delivery SET verified_at=now() WHERE game_id=_game_id;
 RETURN jsonb_build_object('game_id',_game_id,'user_id',launch.buyer_id,'environment',launch.environment,'preview',launch.preview);
END $$;