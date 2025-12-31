-- Create game_scores table for leaderboard
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for user per game (one high score per game per user)
CREATE UNIQUE INDEX game_scores_user_game_idx ON public.game_scores(user_id, game_id);

-- Enable RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Policies for game_scores
CREATE POLICY "Anyone can view game scores"
ON public.game_scores
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own scores"
ON public.game_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
ON public.game_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for user_achievements
CREATE POLICY "Anyone can view achievements"
ON public.user_achievements
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_game_scores_updated_at
BEFORE UPDATE ON public.game_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();