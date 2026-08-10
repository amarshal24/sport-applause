CREATE TABLE public.chat_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

GRANT SELECT, INSERT, DELETE ON public.chat_message_reactions TO authenticated;
GRANT ALL ON public.chat_message_reactions TO service_role;

ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view reactions"
ON public.chat_message_reactions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_messages m
  WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
));

CREATE POLICY "Participants can add their own reactions"
ON public.chat_message_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.chat_messages m
  WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
));

CREATE POLICY "Users can remove their own reactions"
ON public.chat_message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_chat_message_reactions_message ON public.chat_message_reactions(message_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;