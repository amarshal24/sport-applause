-- Add profile_video_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN profile_video_url TEXT;

-- Create storage bucket for profile videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-videos',
  'profile-videos',
  true,
  5242880, -- 5MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
);

-- RLS policies for profile videos bucket
CREATE POLICY "Users can view profile videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-videos');

CREATE POLICY "Users can upload their own profile videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);