-- Replay & captions on live_streams
ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS replay_url text,
  ADD COLUMN IF NOT EXISTS caption_vtt_url text;

-- Highlights table
CREATE TABLE IF NOT EXISTS public.stream_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  label text NOT NULL,
  timestamp_seconds numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stream_highlights_stream
  ON public.stream_highlights (stream_id, timestamp_seconds);

ALTER TABLE public.stream_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Highlights viewable by everyone"
  ON public.stream_highlights
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add highlights"
  ON public.stream_highlights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
  ON public.stream_highlights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights or stream owner can"
  ON public.stream_highlights
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() = (
      SELECT user_id FROM public.live_streams WHERE id = stream_id
    )
  );
