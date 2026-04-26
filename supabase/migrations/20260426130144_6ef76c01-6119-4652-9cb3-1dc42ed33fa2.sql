-- Drafts for the in-app video editor
CREATE TABLE public.video_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  video_title TEXT,
  video_description TEXT,
  caption TEXT,
  edit_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video drafts"
ON public.video_drafts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video drafts"
ON public.video_drafts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video drafts"
ON public.video_drafts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video drafts"
ON public.video_drafts FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_video_drafts_updated_at
BEFORE UPDATE ON public.video_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_video_drafts_user_id ON public.video_drafts(user_id, updated_at DESC);