-- ISSUE-014: allow invitees to claim pending app invites.
-- Safe to re-run (idempotent).

DROP POLICY IF EXISTS "Authenticated users can claim pending invites" ON public.app_invites;

CREATE POLICY "Authenticated users can claim pending invites"
ON public.app_invites
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND used_by IS NULL
  AND inviter_id <> auth.uid()
)
WITH CHECK (
  status = 'used'
  AND used_by = auth.uid()
  AND inviter_id <> auth.uid()
);
