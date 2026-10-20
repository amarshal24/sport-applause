DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post music" ON storage.objects;
CREATE POLICY "Users upload post images to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts' AND (auth.uid())::text = (storage.foldername(name))[1] AND NOT public.is_suspended(auth.uid()));
CREATE POLICY "Users upload post music to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-music' AND (auth.uid())::text = (storage.foldername(name))[1] AND NOT public.is_suspended(auth.uid()));