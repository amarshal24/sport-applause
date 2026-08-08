
DROP POLICY IF EXISTS "Users can send chat messages" ON public.chat_messages;

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND NOT public.is_blocked_between(sender_id, recipient_id)
);
