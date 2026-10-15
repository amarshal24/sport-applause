DELETE FROM public.game_scores WHERE game_id = 'zz_test' OR score > 10000 OR score < 0;
DELETE FROM public.game_scores g WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = g.user_id);
ALTER TABLE public.game_scores ADD CONSTRAINT game_scores_score_range CHECK (score BETWEEN 0 AND 10000);
ALTER TABLE public.game_scores ADD CONSTRAINT game_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_daily_challenges ADD CONSTRAINT udc_score_range CHECK (score BETWEEN 0 AND 10000) NOT VALID;
ALTER TABLE public.multiplayer_matches ADD CONSTRAINT mm_score_range CHECK ((host_score IS NULL OR host_score BETWEEN 0 AND 10000) AND (guest_score IS NULL OR guest_score BETWEEN 0 AND 10000)) NOT VALID;
CREATE POLICY "Players can join waiting matches" ON public.multiplayer_matches FOR UPDATE TO authenticated
  USING (status = 'waiting' AND guest_id IS NULL AND host_id <> auth.uid())
  WITH CHECK (guest_id = auth.uid());
DROP POLICY "Participants can update their matches" ON public.multiplayer_matches;
CREATE POLICY "Participants can update their matches" ON public.multiplayer_matches FOR UPDATE TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = guest_id)
  WITH CHECK ((auth.uid() = host_id OR auth.uid() = guest_id) AND (winner_id IS NULL OR winner_id = host_id OR winner_id = guest_id));
NOTIFY pgrst, 'reload schema';