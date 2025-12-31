import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Star, CheckCircle2, Clock, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDailyChallenges, DailyChallenge } from '@/hooks/useDailyChallenges';

const gameIcons: Record<string, string> = {
  basketball: '🏀',
  soccer: '⚽',
  football: '🏈',
  tennis: '🎾',
  golf: '⛳',
  hockey: '🏒',
  baseball: '⚾',
  volleyball: '🏐'
};

interface DailyChallengesProps {
  compact?: boolean;
  selectedGame?: string;
}

const DailyChallenges: React.FC<DailyChallengesProps> = ({ 
  compact = false,
  selectedGame 
}) => {
  const { challenges, isLoading, totalRewardPoints } = useDailyChallenges();

  const filteredChallenges = selectedGame 
    ? challenges.filter(c => c.game_id === selectedGame)
    : challenges;

  const completedCount = filteredChallenges.filter(c => c.user_progress?.completed).length;

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/20">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">Daily Challenges</p>
                <p className="text-sm text-muted-foreground">
                  {completedCount}/{filteredChallenges.length} completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-500">{totalRewardPoints} pts</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            Daily Challenges
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Gift className="w-3 h-3 mr-1" />
            {totalRewardPoints} pts earned
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No challenges available</p>
            <p className="text-sm">Check back tomorrow!</p>
          </div>
        ) : (
          filteredChallenges.map((challenge, index) => (
            <ChallengeCard key={challenge.id} challenge={challenge} index={index} />
          ))
        )}
      </CardContent>
    </Card>
  );
};

const ChallengeCard: React.FC<{ challenge: DailyChallenge; index: number }> = ({ 
  challenge, 
  index 
}) => {
  const progress = challenge.user_progress 
    ? Math.min((challenge.user_progress.score / challenge.target_score) * 100, 100)
    : 0;
  const isCompleted = challenge.user_progress?.completed;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-lg border ${
        isCompleted 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-background/50 border-border/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{gameIcons[challenge.game_id] || '🎮'}</span>
          <div>
            <p className="font-medium flex items-center gap-2">
              {challenge.description}
              {isCompleted && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Target: {challenge.target_score} points
            </p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={isCompleted 
            ? 'bg-green-500/10 text-green-500 border-green-500/30'
            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
          }
        >
          <Star className="w-3 h-3 mr-1" />
          {challenge.reward_points} pts
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {challenge.user_progress?.score || 0} / {challenge.target_score}
          </span>
        </div>
        <Progress 
          value={progress} 
          className={`h-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`}
        />
      </div>
    </motion.div>
  );
};

export default DailyChallenges;
