-- Fix 1: Restrict profile visibility to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Fix 2: Make all storage buckets private
UPDATE storage.buckets SET public = false WHERE id = 'posts';
UPDATE storage.buckets SET public = false WHERE id = 'stories';
UPDATE storage.buckets SET public = false WHERE id = 'profile-videos';
UPDATE storage.buckets SET public = false WHERE id = 'recruiting-videos';
UPDATE storage.buckets SET public = false WHERE id = 'podcasts';
UPDATE storage.buckets SET public = false WHERE id = 'top-five-videos';
UPDATE storage.buckets SET public = false WHERE id = 'animator-creations';
UPDATE storage.buckets SET public = false WHERE id = 'post-videos';
UPDATE storage.buckets SET public = false WHERE id = 'post-music';
UPDATE storage.buckets SET public = false WHERE id = 'chat-images';

-- Fix 3: Add RLS policies for authenticated access to storage
-- First, drop any existing policies we'll recreate
DROP POLICY IF EXISTS "Authenticated users can access posts files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access stories files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access profile-videos files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access recruiting-videos files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access podcasts files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access top-five-videos files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access animator-creations files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access post-videos files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access post-music files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access chat-images files" ON storage.objects;

-- Create unified policy for authenticated users to read all bucket files
CREATE POLICY "Authenticated users can access all storage files"
  ON storage.objects FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy for users to upload to their own folder in buckets
CREATE POLICY "Users can upload files to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);