-- Add sports array to profiles table
ALTER TABLE public.profiles 
ADD COLUMN sports text[] DEFAULT '{}';

-- Create index for better query performance on sports
CREATE INDEX idx_profiles_sports ON public.profiles USING GIN(sports);