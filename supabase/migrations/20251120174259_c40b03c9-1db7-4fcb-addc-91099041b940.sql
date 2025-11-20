-- Create storage buckets for posts and stories
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('posts', 'posts', true),
  ('stories', 'stories', true);

-- Create policies for post images
CREATE POLICY "Anyone can view post images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own post images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policies for story images
CREATE POLICY "Anyone can view story images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload story images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own story images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own story images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add triggers for updated_at (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_posts_updated_at
      BEFORE UPDATE ON public.posts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;