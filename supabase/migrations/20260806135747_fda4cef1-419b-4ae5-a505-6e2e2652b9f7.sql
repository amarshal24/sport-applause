CREATE TABLE public.post_reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.post_reposts TO authenticated;
GRANT ALL ON public.post_reposts TO service_role;

ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reposts"
  ON public.post_reposts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own reposts"
  ON public.post_reposts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reposts"
  ON public.post_reposts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_post_reposts_user ON public.post_reposts(user_id);
CREATE INDEX idx_post_reposts_post ON public.post_reposts(post_id);

ALTER TABLE public.post_reposts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reposts;