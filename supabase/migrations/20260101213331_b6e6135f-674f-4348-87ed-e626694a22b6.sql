-- Add anime filter preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS anime_filter_preference text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS anime_filter_intensity integer DEFAULT 100;

-- Add constraint for valid intensity range
ALTER TABLE public.profiles
ADD CONSTRAINT anime_filter_intensity_range CHECK (anime_filter_intensity >= 0 AND anime_filter_intensity <= 100);