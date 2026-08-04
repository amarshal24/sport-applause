-- 1. Remove blanket "any authenticated user reads everything" storage policy
DROP POLICY IF EXISTS "Authenticated users can access all storage files" ON storage.objects;

-- 2. Animator creations: owner-only reads (matches animator_creations table RLS)
DROP POLICY IF EXISTS "Animator creations are publicly viewable" ON storage.objects;
CREATE POLICY "Users can view their own animator creations"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'animator-creations' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3. Chat images: sender or recipient of the related message only
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
CREATE POLICY "Chat participants can view chat images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE m.recipient_id = auth.uid()
        AND m.image_url LIKE '%' || storage.objects.name
    )
  )
);

-- 4. Profile videos: authenticated users only (profiles are auth-gated in the app)
DROP POLICY IF EXISTS "Users can view profile videos" ON storage.objects;
CREATE POLICY "Authenticated users can view profile videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-videos');

-- 5. app_invites: no anonymous table-wide reads; exact-code lookup via security definer RPC
DROP POLICY IF EXISTS "Anyone can view invite by code" ON public.app_invites;

CREATE OR REPLACE FUNCTION public.get_invite_by_code(_invite_code text)
RETURNS TABLE (id uuid, inviter_id uuid, invite_code text, status text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.inviter_id, i.invite_code, i.status, i.created_at
  FROM public.app_invites i
  WHERE i.invite_code = _invite_code
    AND i.status = 'pending'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_by_code(text) TO authenticated;