DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post music" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view recruiting videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view story images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view top 5 videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view marketplace images" ON storage.objects;
CREATE POLICY "Signed-in users can view app media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('posts','post-music','post-videos','recruiting-videos','stories','top-five-videos','marketplace') AND auth.uid() IS NOT NULL);