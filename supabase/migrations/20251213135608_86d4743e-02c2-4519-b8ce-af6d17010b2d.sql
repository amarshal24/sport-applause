-- Create table for user's top 5 highlight videos
CREATE TABLE public.top_five_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, position)
);

-- Enable RLS
ALTER TABLE public.top_five_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Top 5 videos are viewable by everyone"
ON public.top_five_videos
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own top 5 videos"
ON public.top_five_videos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own top 5 videos"
ON public.top_five_videos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own top 5 videos"
ON public.top_five_videos
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_top_five_videos_updated_at
BEFORE UPDATE ON public.top_five_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for top 5 videos
INSERT INTO storage.buckets (id, name, public) VALUES ('top-five-videos', 'top-five-videos', true);

-- Storage policies for top 5 videos bucket
CREATE POLICY "Anyone can view top 5 videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'top-five-videos');

CREATE POLICY "Users can upload their own top 5 videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'top-five-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own top 5 videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'top-five-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own top 5 videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'top-five-videos' AND auth.uid()::text = (storage.foldername(name))[1]);