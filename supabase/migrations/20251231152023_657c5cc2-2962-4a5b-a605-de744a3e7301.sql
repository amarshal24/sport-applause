-- Add video_url column to posts table
ALTER TABLE public.posts ADD COLUMN video_url TEXT;

-- Create storage bucket for post videos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-videos', 'post-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for post videos
CREATE POLICY "Anyone can view post videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-videos');

CREATE POLICY "Authenticated users can upload post videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own post videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-videos' AND auth.uid()::text = (storage.foldername(name))[1]);