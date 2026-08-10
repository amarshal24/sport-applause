ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
UPDATE public.chat_messages SET read_at = created_at WHERE read = true AND read_at IS NULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;