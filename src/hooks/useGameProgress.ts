import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ACHIEVEMENTS, GameStats, Achievement } from "@/constants/achievements";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  user_id: string;
  game_id: string;
  score: number;
  username?: string;
  avatar_url?: string;
}

export const useGameProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<Record<string, LeaderboardEntry[]>>({});
  const [userScores, setUserScores] = useState<Record<string, number>>({});
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  // Fetch user achievements
  const fetchUserAchievements = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);
    
    if (data) {
      setUserAchievements(data.map((a) => a.achievement_id));
    }
  }, [user]);

  // Fetch user scores
  const fetchUserScores = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("game_scores")
      .select("game_id, score")
      .eq("user_id", user.id);
    
    if (data) {
      const scores: Record<string, number> = {};
      let total = 0;
      data.forEach((s) => {
        scores[s.game_id] = s.score;
        total += s.score;
      });
      setUserScores(scores);
      setTotalScore(total);
      setGamesPlayed(data.length);
    }
  }, [user]);

  // Fetch global leaderboard
  const fetchLeaderboard = useCallback(async (gameId?: string) => {
    let query = supabase
      .from("game_scores")
      .select(`
        user_id,
        game_id,
        score,
        profiles (
          username,
          avatar_url
        )
      `)
      .order("score", { ascending: false })
      .limit(10);
    
    if (gameId) {
      query = query.eq("game_id", gameId);
    }
    
    const { data } = await query;
    
    if (data) {
      const grouped: Record<string, LeaderboardEntry[]> = {};
      data.forEach((entry: any) => {
        const gameKey = entry.game_id;
        if (!grouped[gameKey]) grouped[gameKey] = [];
        grouped[gameKey].push({
          user_id: entry.user_id,
          game_id: entry.game_id,
          score: entry.score,
          username: entry.profiles?.username,
          avatar_url: entry.profiles?.avatar_url,
        });
      });
      setLeaderboard((prev) => ({ ...prev, ...grouped }));
    }
  }, []);

  // Submit score and check achievements
  const submitScore = useCallback(async (gameId: string, score: number, streakMax: number = 0) => {
    if (!user) return;

    // Upsert score (update if exists, insert if not)
    const { data: existingScore } = await supabase
      .from("game_scores")
      .select("score")
      .eq("user_id", user.id)
      .eq("game_id", gameId)
      .maybeSingle();

    if (existingScore) {
      if (score > existingScore.score) {
        await supabase
          .from("game_scores")
          .update({ score })
          .eq("user_id", user.id)
          .eq("game_id", gameId);
      }
    } else {
      await supabase
        .from("game_scores")
        .insert({ user_id: user.id, game_id: gameId, score });
    }

    // Check for new achievements
    const newHighScore = existingScore ? Math.max(existingScore.score, score) : score;
    const stats: GameStats = {
      gamesPlayed: gamesPlayed + 1,
      totalScore: totalScore + score,
      highScore: newHighScore,
      streakMax,
      perfectGames: 0,
      gameId,
    };

    const newAchievements: Achievement[] = [];
    
    for (const achievement of ACHIEVEMENTS) {
      if (!userAchievements.includes(achievement.id) && achievement.condition(stats)) {
        newAchievements.push(achievement);
        
        // Save achievement to database
        await supabase
          .from("user_achievements")
          .insert({ user_id: user.id, achievement_id: achievement.id })
          .select();
      }
    }

    // Show toast for new achievements
    if (newAchievements.length > 0) {
      newAchievements.forEach((achievement) => {
        toast({
          title: `🏆 Achievement Unlocked!`,
          description: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
        });
      });
      
      setUserAchievements((prev) => [...prev, ...newAchievements.map((a) => a.id)]);
    }

    // Refresh data
    fetchUserScores();
    fetchLeaderboard(gameId);
  }, [user, userAchievements, gamesPlayed, totalScore, toast, fetchUserScores, fetchLeaderboard]);

  useEffect(() => {
    if (user) {
      fetchUserAchievements();
      fetchUserScores();
      fetchLeaderboard();
    }
  }, [user, fetchUserAchievements, fetchUserScores, fetchLeaderboard]);

  return {
    userAchievements,
    leaderboard,
    userScores,
    gamesPlayed,
    totalScore,
    submitScore,
    fetchLeaderboard,
    refreshData: () => {
      fetchUserAchievements();
      fetchUserScores();
      fetchLeaderboard();
    },
  };
};