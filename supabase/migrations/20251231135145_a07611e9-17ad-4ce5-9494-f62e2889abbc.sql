-- Create table for saved animator creations
CREATE TABLE public.animator_creations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  character_sport TEXT NOT NULL,
  animation_type TEXT NOT NULL,
  background_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.animator_creations ENABLE ROW LEVEL SECURITY;

-- Users can view their own creations
CREATE POLICY "Users can view their own creations"
ON public.animator_creations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own creations
CREATE POLICY "Users can create their own creations"
ON public.animator_creations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own creations
CREATE POLICY "Users can delete their own creations"
ON public.animator_creations
FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for animator creations
INSERT INTO storage.buckets (id, name, public) VALUES ('animator-creations', 'animator-creations', true);

-- Storage policies
CREATE POLICY "Users can upload their own animator creations"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'animator-creations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Animator creations are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'animator-creations');

CREATE POLICY "Users can delete their own animator creations"
ON storage.objects
FOR DELETE
USING (bucket_id = 'animator-creations' AND auth.uid()::text = (storage.foldername(name))[1]);