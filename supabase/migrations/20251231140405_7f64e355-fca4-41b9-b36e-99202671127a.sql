-- Create table for storing athlete comparison history
CREATE TABLE public.comparison_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL,
  height TEXT NOT NULL,
  weight TEXT NOT NULL,
  position TEXT,
  stats JSONB DEFAULT '{}'::jsonb,
  matches JSONB NOT NULL,
  overall_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comparison_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own comparison history
CREATE POLICY "Users can view their own comparison history"
ON public.comparison_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own comparison history
CREATE POLICY "Users can create their own comparison history"
ON public.comparison_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comparison history
CREATE POLICY "Users can delete their own comparison history"
ON public.comparison_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_comparison_history_user_id ON public.comparison_history(user_id);
CREATE INDEX idx_comparison_history_created_at ON public.comparison_history(created_at DESC);