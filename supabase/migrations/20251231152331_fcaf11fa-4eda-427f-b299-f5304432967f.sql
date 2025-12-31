-- Add music_url and music_title columns to posts table
ALTER TABLE public.posts ADD COLUMN music_url TEXT;
ALTER TABLE public.posts ADD COLUMN music_title TEXT;