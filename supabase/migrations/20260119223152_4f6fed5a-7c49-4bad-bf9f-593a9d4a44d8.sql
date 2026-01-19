-- Create marketplace listings table
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'equipment',
  condition TEXT NOT NULL DEFAULT 'used',
  location TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Policies for marketplace listings
CREATE POLICY "Active listings are viewable by authenticated users"
  ON public.marketplace_listings FOR SELECT
  USING (auth.role() = 'authenticated' AND status = 'active');

CREATE POLICY "Users can view their own listings regardless of status"
  ON public.marketplace_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own listings"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON public.marketplace_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for marketplace images
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace', 'marketplace', false);

-- Storage policies for marketplace images
CREATE POLICY "Authenticated users can view marketplace images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketplace' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload marketplace images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'marketplace' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their marketplace images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'marketplace' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their marketplace images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'marketplace' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();