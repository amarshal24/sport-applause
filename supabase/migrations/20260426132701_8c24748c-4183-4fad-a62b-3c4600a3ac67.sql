-- Create watch_later table for users to save posts to watch later
CREATE TABLE public.watch_later (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_watch_later_user_id ON public.watch_later(user_id);
CREATE INDEX idx_watch_later_post_id ON public.watch_later(post_id);

ALTER TABLE public.watch_later ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch later list"
ON public.watch_later FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watch later list"
ON public.watch_later FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own watch later list"
ON public.watch_later FOR DELETE
USING (auth.uid() = user_id);