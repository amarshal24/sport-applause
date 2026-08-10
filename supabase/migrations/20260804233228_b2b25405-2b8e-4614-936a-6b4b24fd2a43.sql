ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_video_caption text,
  ADD COLUMN IF NOT EXISTS profile_video_caption_vtt text;