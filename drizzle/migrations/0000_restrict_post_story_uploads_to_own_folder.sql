DROP POLICY IF EXISTS "Authenticated users can upload post videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload story images" ON storage.objects;
CREATE POLICY "Users upload post videos to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload story media to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stories' AND (auth.uid())::text = (storage.foldername(name))[1]);