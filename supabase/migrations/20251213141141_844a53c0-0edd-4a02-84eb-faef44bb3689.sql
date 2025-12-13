-- Create recruiter interests table
CREATE TABLE public.recruiter_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL,
  athlete_id UUID NOT NULL,
  interest_level INTEGER NOT NULL CHECK (interest_level >= 1 AND interest_level <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (recruiter_id, athlete_id)
);

-- Enable Row Level Security
ALTER TABLE public.recruiter_interests ENABLE ROW LEVEL SECURITY;

-- Recruiters can view their own interest ratings
CREATE POLICY "Recruiters can view their own interests"
ON public.recruiter_interests
FOR SELECT
USING (auth.uid() = recruiter_id);

-- Recruiters can create their own interest ratings
CREATE POLICY "Recruiters can create their own interests"
ON public.recruiter_interests
FOR INSERT
WITH CHECK (auth.uid() = recruiter_id);

-- Recruiters can update their own interest ratings
CREATE POLICY "Recruiters can update their own interests"
ON public.recruiter_interests
FOR UPDATE
USING (auth.uid() = recruiter_id);

-- Recruiters can delete their own interest ratings
CREATE POLICY "Recruiters can delete their own interests"
ON public.recruiter_interests
FOR DELETE
USING (auth.uid() = recruiter_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recruiter_interests_updated_at
BEFORE UPDATE ON public.recruiter_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();