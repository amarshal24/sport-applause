-- Create recruiting_videos table for athlete highlight reels
CREATE TABLE public.recruiting_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  sport text NOT NULL,
  position text,
  graduation_year integer,
  stats jsonb DEFAULT '{}'::jsonb,
  height text,
  weight text,
  location text,
  school text,
  views_count integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.recruiting_videos ENABLE ROW LEVEL SECURITY;

-- Everyone can view active recruiting videos (public for recruiters/scouts)
CREATE POLICY "Anyone can view active recruiting videos"
ON public.recruiting_videos
FOR SELECT
USING (status = 'active');

-- Users can create their own recruiting videos
CREATE POLICY "Users can create their own recruiting videos"
ON public.recruiting_videos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own recruiting videos
CREATE POLICY "Users can update their own recruiting videos"
ON public.recruiting_videos
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own recruiting videos
CREATE POLICY "Users can delete their own recruiting videos"
ON public.recruiting_videos
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_recruiting_videos_user_id ON public.recruiting_videos(user_id);
CREATE INDEX idx_recruiting_videos_sport ON public.recruiting_videos(sport);
CREATE INDEX idx_recruiting_videos_featured ON public.recruiting_videos(featured) WHERE featured = true;
CREATE INDEX idx_recruiting_videos_created_at ON public.recruiting_videos(created_at DESC);

-- Create storage bucket for recruiting videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recruiting-videos',
  'recruiting-videos',
  true,
  209715200, -- 200MB limit for 3-minute videos
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for recruiting videos bucket
CREATE POLICY "Anyone can view recruiting videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'recruiting-videos');

CREATE POLICY "Users can upload their own recruiting videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recruiting-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own recruiting videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recruiting-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own recruiting videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recruiting-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add trigger for updated_at
CREATE TRIGGER update_recruiting_videos_updated_at
BEFORE UPDATE ON public.recruiting_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();