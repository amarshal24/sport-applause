-- Direct messages: let a recipient change receipt state only.
--
-- Before: the policy "Users can update their received messages" had USING but no WITH CHECK
-- and table-level UPDATE was granted, so a recipient could rewrite content, image_url,
-- created_at and even sender_id/recipient_id of a message they received (editing what the
-- sender "said" or forging a message from another user).
-- The app only ever updates read, read_at and delivered_at (src/hooks/useChat.ts), so
-- UPDATE is narrowed to exactly those columns. Reads, inserts, deletes and the service role
-- are unchanged; no rows or data are modified by this migration.

REVOKE UPDATE ON public.chat_messages FROM PUBLIC, anon, authenticated;
GRANT UPDATE (read, read_at, delivered_at) ON public.chat_messages TO authenticated;

DROP POLICY IF EXISTS "Users can update their received messages" ON public.chat_messages;
CREATE POLICY "Users can update their received messages"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);
