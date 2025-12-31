-- Add fade in/out columns to posts table
ALTER TABLE public.posts 
ADD COLUMN music_fade_in NUMERIC DEFAULT 0,
ADD COLUMN music_fade_out NUMERIC DEFAULT 0;