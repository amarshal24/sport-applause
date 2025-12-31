-- Add music trim columns to posts table
ALTER TABLE public.posts 
ADD COLUMN music_start_time DECIMAL DEFAULT 0,
ADD COLUMN music_end_time DECIMAL DEFAULT NULL;