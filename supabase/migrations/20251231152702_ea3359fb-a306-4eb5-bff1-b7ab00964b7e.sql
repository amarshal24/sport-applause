-- Create storage bucket for post music
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-music', 'post-music', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for post music
CREATE POLICY "Anyone can view post music"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-music');

CREATE POLICY "Authenticated users can upload post music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-music' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own post music"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-music' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post music"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-music' AND auth.uid()::text = (storage.foldername(name))[1]);