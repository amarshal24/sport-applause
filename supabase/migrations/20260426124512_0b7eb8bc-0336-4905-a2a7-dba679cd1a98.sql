
-- Multi-emoji reactions on feed posts
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_id_idx ON public.post_reactions(user_id);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by everyone"
  ON public.post_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own reactions"
  ON public.post_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.post_reactions
  FOR DELETE
  USING (auth.uid() = user_id);
