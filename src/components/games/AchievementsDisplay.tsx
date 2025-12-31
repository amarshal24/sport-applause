import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Lock } from "lucide-react";
import { ACHIEVEMENTS, RARITY_COLORS, RARITY_BORDERS } from "@/constants/achievements";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AchievementsDisplayProps {
  unlockedAchievements: string[];
  compact?: boolean;
}

const AchievementsDisplay = ({ unlockedAchievements, compact = false }: AchievementsDisplayProps) => {
  const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
    const aUnlocked = unlockedAchievements.includes(a.id);
    const bUnlocked = unlockedAchievements.includes(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  const displayAchievements = compact ? sortedAchievements.slice(0, 6) : sortedAchievements;
  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <Card className="glass-effect">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Achievements
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {unlockedCount}/{totalCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={compact ? "h-auto" : "h-[400px]"}>
          <div className={cn(
            "grid gap-3",
            compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
          )}>
            {displayAchievements.map((achievement, index) => {
              const isUnlocked = unlockedAchievements.includes(achievement.id);
              
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "relative p-3 rounded-xl border-2 text-center transition-all",
                    isUnlocked
                      ? `bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} ${RARITY_BORDERS[achievement.rarity]}`
                      : "bg-muted/30 border-muted opacity-50 grayscale"
                  )}
                >
                  <div className="text-3xl mb-1">
                    {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 mx-auto text-muted-foreground" />}
                  </div>
                  <h4 className={cn(
                    "font-semibold text-xs truncate",
                    isUnlocked ? "text-white" : "text-muted-foreground"
                  )}>
                    {achievement.name}
                  </h4>
                  {!compact && (
                    <p className={cn(
                      "text-[10px] mt-1 line-clamp-2",
                      isUnlocked ? "text-white/80" : "text-muted-foreground"
                    )}>
                      {achievement.description}
                    </p>
                  )}
                  <div className={cn(
                    "absolute top-1 right-1 text-[8px] font-bold uppercase px-1 rounded",
                    isUnlocked ? "text-white/90" : "text-muted-foreground"
                  )}>
                    {achievement.rarity}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
        
        {compact && unlockedCount > 6 && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            +{unlockedCount - 6} more unlocked
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsDisplay;