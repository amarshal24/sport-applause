ALTER TABLE public.multiplayer_matches DROP CONSTRAINT mm_score_range;
ALTER TABLE public.multiplayer_matches ADD CONSTRAINT mm_score_range CHECK ((host_score IS NULL OR host_score BETWEEN -1 AND 10000) AND (guest_score IS NULL OR guest_score BETWEEN -1 AND 10000));
DELETE FROM public.game_scores WHERE game_id = 'zz_test';