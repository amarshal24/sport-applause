-- Create multiplayer matches table
CREATE TABLE public.multiplayer_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  host_id UUID NOT NULL,
  guest_id UUID,
  host_score INTEGER DEFAULT 0,
  guest_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.multiplayer_matches ENABLE ROW LEVEL SECURITY;

-- Policies for multiplayer matches
CREATE POLICY "Anyone can view active matches" 
ON public.multiplayer_matches 
FOR SELECT 
USING (status IN ('waiting', 'playing'));

CREATE POLICY "Users can create matches" 
ON public.multiplayer_matches 
FOR INSERT 
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Participants can update their matches" 
ON public.multiplayer_matches 
FOR UPDATE 
USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Host can delete their waiting matches" 
ON public.multiplayer_matches 
FOR DELETE 
USING (auth.uid() = host_id AND status = 'waiting');

-- Enable realtime for multiplayer matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_matches;

-- Create daily challenges table
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target_score INTEGER NOT NULL,
  description TEXT NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 100,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Anyone can view daily challenges
CREATE POLICY "Anyone can view daily challenges" 
ON public.daily_challenges 
FOR SELECT 
USING (true);

-- Create user daily challenge completions table
CREATE TABLE public.user_daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;

-- Users can view their own challenge progress
CREATE POLICY "Users can view their own challenge progress" 
ON public.user_daily_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own challenge progress
CREATE POLICY "Users can insert their own challenge progress" 
ON public.user_daily_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own challenge progress
CREATE POLICY "Users can update their own challenge progress" 
ON public.user_daily_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert some daily challenges
INSERT INTO public.daily_challenges (game_id, challenge_type, target_score, description, reward_points) VALUES
('basketball', 'high_score', 50, 'Score 50 points in Basketball', 100),
('soccer', 'high_score', 40, 'Score 40 points in Soccer', 100),
('football', 'high_score', 35, 'Score 35 points in Football', 100),
('tennis', 'high_score', 45, 'Score 45 points in Tennis', 100),
('golf', 'high_score', 30, 'Score 30 points in Golf', 150),
('hockey', 'high_score', 40, 'Score 40 points in Hockey', 100),
('baseball', 'high_score', 50, 'Score 50 points in Baseball', 100),
('volleyball', 'high_score', 35, 'Score 35 points in Volleyball', 100);