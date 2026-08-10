-- Chat images: exact path equality instead of LIKE pattern
DROP POLICY IF EXISTS "Chat participants can view chat images" ON storage.objects;
CREATE POLICY "Chat participants can view chat images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE m.recipient_id = auth.uid()
        AND split_part(split_part(m.image_url, '/chat-images/', 2), '?', 1) = objects.name
    )
  )
);

-- Game scores: authenticated only
DROP POLICY IF EXISTS "Anyone can view game scores" ON public.game_scores;
CREATE POLICY "Authenticated users can view game scores"
ON public.game_scores FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.game_scores FROM anon;

-- Achievements: authenticated only
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.user_achievements;
CREATE POLICY "Authenticated users can view achievements"
ON public.user_achievements FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.user_achievements FROM anon;

-- Multiplayer matches: authenticated only
DROP POLICY IF EXISTS "Anyone can view active matches" ON public.multiplayer_matches;
CREATE POLICY "Authenticated users can view active matches"
ON public.multiplayer_matches FOR SELECT TO authenticated
USING (status = ANY (ARRAY['waiting','playing']) OR auth.uid() = host_id OR auth.uid() = guest_id);
REVOKE SELECT ON public.multiplayer_matches FROM anon;