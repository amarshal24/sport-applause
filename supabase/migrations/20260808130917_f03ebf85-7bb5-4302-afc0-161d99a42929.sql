
DROP POLICY IF EXISTS "Authenticated users can claim pending invites" ON public.app_invites;

CREATE POLICY "Invitees can claim invites addressed to them"
ON public.app_invites
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND used_by IS NULL
  AND inviter_id <> auth.uid()
  AND (
    invitee_email IS NULL
    OR lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  )
)
WITH CHECK (
  status = 'used'
  AND used_by = auth.uid()
  AND inviter_id <> auth.uid()
  AND (
    invitee_email IS NULL
    OR lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  )
);

CREATE OR REPLACE FUNCTION public.get_invite_by_code(_invite_code text)
RETURNS TABLE(id uuid, inviter_id uuid, invite_code text, status text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT i.id, i.inviter_id, i.invite_code, i.status, i.created_at
  FROM public.app_invites i
  WHERE i.invite_code = _invite_code
    AND i.status = 'pending'
    AND i.used_by IS NULL
    AND i.inviter_id <> auth.uid()
    AND (
      i.invitee_email IS NULL
      OR lower(i.invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_invite_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_code(text) TO authenticated;
