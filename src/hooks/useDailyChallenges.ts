import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DailyChallenge {
  id: string;
  game_id: string;
  challenge_type: string;
  target_score: number;
  description: string;
  reward_points: number;
  challenge_date: string;
  user_progress?: {
    score: number;
    completed: boolean;
    completed_at: string | null;
  };
}

export const useDailyChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRewardPoints, setTotalRewardPoints] = useState(0);

  // Fetch today's challenges with user progress
  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: challengesData, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today);

    if (error) {
      console.error('Error fetching challenges:', error);
      setIsLoading(false);
      return;
    }

    if (!challengesData || challengesData.length === 0) {
      // If no challenges for today, get all challenges (they're reusable)
      const { data: allChallenges } = await supabase
        .from('daily_challenges')
        .select('*');
      
      if (allChallenges && allChallenges.length > 0) {
        // Use existing challenges
        await processChallenges(allChallenges);
      }
    } else {
      await processChallenges(challengesData);
    }
    
    setIsLoading(false);
  }, [user]);

  const processChallenges = async (challengesData: any[]) => {
    if (!user) {
      setChallenges(challengesData as DailyChallenge[]);
      return;
    }

    // Fetch user progress for these challenges
    const challengeIds = challengesData.map(c => c.id);
    const { data: progressData } = await supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', user.id)
      .in('challenge_id', challengeIds);

    const progressMap = new Map(
      (progressData || []).map(p => [p.challenge_id, {
        score: p.score,
        completed: p.completed,
        completed_at: p.completed_at
      }])
    );

    const challengesWithProgress = challengesData.map(challenge => ({
      ...challenge,
      user_progress: progressMap.get(challenge.id)
    })) as DailyChallenge[];

    setChallenges(challengesWithProgress);

    // Calculate total earned points
    const earnedPoints = challengesWithProgress
      .filter(c => c.user_progress?.completed)
      .reduce((sum, c) => sum + c.reward_points, 0);
    setTotalRewardPoints(earnedPoints);
  };

  // Submit score for a challenge
  const submitChallengeScore = useCallback(async (gameId: string, score: number) => {
    if (!user) return;

    // Find the challenge for this game
    const challenge = challenges.find(c => c.game_id === gameId);
    if (!challenge) return;

    const completed = score >= challenge.target_score;

    // Check if user already has progress
    const { data: existing } = await supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_id', challenge.id)
      .single();

    if (existing) {
      // Update if new score is higher
      if (score > existing.score) {
        const updateData: any = { score };
        if (completed && !existing.completed) {
          updateData.completed = true;
          updateData.completed_at = new Date().toISOString();
        }

        await supabase
          .from('user_daily_challenges')
          .update(updateData)
          .eq('id', existing.id);
      }
    } else {
      // Insert new progress
      await supabase
        .from('user_daily_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          score,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        });
    }

    if (completed && !existing?.completed) {
      toast({
        title: '🎉 Challenge Complete!',
        description: `You earned ${challenge.reward_points} reward points!`
      });
    }

    // Refresh challenges
    fetchChallenges();
  }, [user, challenges, toast, fetchChallenges]);

  // Get challenge for specific game
  const getChallengeForGame = useCallback((gameId: string) => {
    return challenges.find(c => c.game_id === gameId);
  }, [challenges]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return {
    challenges,
    isLoading,
    totalRewardPoints,
    submitChallengeScore,
    getChallengeForGame,
    fetchChallenges
  };
};
