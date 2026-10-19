CREATE FUNCTION public.can_review_creator_game(_game_id uuid, _environment text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT auth.uid() IS NOT NULL AND _environment = 'sandbox' AND EXISTS (
 SELECT 1 FROM public.creator_games g JOIN public.creator_game_delivery d ON d.game_id=g.id
 JOIN public.creator_game_orders o ON o.game_id=g.id AND o.buyer_id=auth.uid()
 WHERE g.id=_game_id AND g.status='approved' AND g.creator_id<>auth.uid()
 AND NOT public.is_suspended(auth.uid()) AND NOT public.is_suspended(g.creator_id)
 AND d.verified_at IS NOT NULL AND d.reviewed_at IS NOT NULL
 AND o.environment=_environment AND o.status='paid' AND o.refunded_cents<o.amount_cents
 AND o.delivery_revision=d.revision AND o.reconciled_at IS NOT NULL AND o.settled_at IS NOT NULL
 );
$$;
REVOKE ALL ON FUNCTION public.can_review_creator_game(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_review_creator_game(uuid,text) TO authenticated;
CREATE TABLE public.creator_game_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 game_id uuid NOT NULL REFERENCES public.creator_games(id) ON DELETE CASCADE,
 buyer_id uuid NOT NULL,
 environment text NOT NULL CHECK (environment IN ('sandbox','live')),
 rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(game_id,buyer_id,environment)
);
GRANT SELECT ON public.creator_game_reviews TO authenticated;
GRANT ALL ON public.creator_game_reviews TO service_role;
ALTER TABLE public.creator_game_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read reviews of approved games" ON public.creator_game_reviews FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.creator_games g WHERE g.id=game_id AND g.status='approved'));
CREATE INDEX creator_game_reviews_game_idx ON public.creator_game_reviews(game_id,environment,created_at DESC);
CREATE FUNCTION public.submit_creator_game_review(_game_id uuid,_environment text,_rating integer,_body text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 -- Lock current delivery and order rows against concurrent revocation while authorizing this write.
 PERFORM 1 FROM public.creator_games WHERE id=_game_id FOR SHARE;
 PERFORM 1 FROM public.creator_game_delivery WHERE game_id=_game_id FOR SHARE;
 PERFORM 1 FROM public.creator_game_orders WHERE game_id=_game_id AND buyer_id=auth.uid() AND environment=_environment FOR SHARE;
 IF NOT public.can_review_creator_game(_game_id,_environment) THEN RAISE EXCEPTION 'Verified purchase with current game access required'; END IF;
 IF _rating IS NULL OR _rating NOT BETWEEN 1 AND 5 OR _body IS NULL OR char_length(btrim(_body)) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Choose 1 to 5 stars and write a review of up to 2000 characters'; END IF;
 INSERT INTO public.creator_game_reviews(game_id,buyer_id,environment,rating,body) VALUES(_game_id,auth.uid(),_environment,_rating,btrim(_body))
 ON CONFLICT(game_id,buyer_id,environment) DO UPDATE SET rating=excluded.rating, body=excluded.body, updated_at=now()
 RETURNING id INTO result;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_creator_game_review(uuid,text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_creator_game_review(uuid,text,integer,text) TO authenticated;