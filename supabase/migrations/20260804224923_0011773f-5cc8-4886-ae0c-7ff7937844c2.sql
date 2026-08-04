ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_delivered
  ON public.chat_messages (recipient_id)
  WHERE delivered_at IS NULL;