CREATE TABLE public.fx_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label TEXT NOT NULL,
  clip_key TEXT NOT NULL,
  clip_duration NUMERIC,
  path JSONB NOT NULL,
  avg_confidence NUMERIC,
  worst_confidence NUMERIC,
  health TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX fx_tracks_user_clip_idx ON public.fx_tracks (user_id, clip_key, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fx_tracks TO authenticated;
GRANT ALL ON public.fx_tracks TO service_role;

ALTER TABLE public.fx_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved tracks"
ON public.fx_tracks FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_fx_tracks_updated_at
BEFORE UPDATE ON public.fx_tracks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();