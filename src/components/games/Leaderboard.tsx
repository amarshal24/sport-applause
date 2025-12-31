import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  user_id: string;
  game_id: string;
  score: number;
  username?: string;
  avatar_url?: string;
  rank?: number;
}

const GAMES = [
  { id: "all", name: "All Games", emoji: "🎮" },
  { id: "basketball", name: "Basketball", emoji: "🏀" },
  { id: "soccer", name: "Soccer", emoji: "⚽" },
  { id: "football", name: "Football", emoji: "🏈" },
  { id: "tennis", name: "Tennis", emoji: "🎾" },
  { id: "hockey", name: "Hockey", emoji: "🏒" },
  { id: "baseball", name: "Baseball", emoji: "⚾" },
  { id: "golf", name: "Golf", emoji: "⛳" },
  { id: "volleyball", name: "Volleyball", emoji: "🏐" },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="w-5 text-center text-muted-foreground font-medium">{rank}</span>;
  }
};

interface LeaderboardProps {
  compact?: boolean;
}

const Leaderboard = ({ compact = false }: LeaderboardProps) => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedGame]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
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
      .limit(compact ? 5 : 50);
    
    if (selectedGame !== "all") {
      query = query.eq("game_id", selectedGame);
    }
    
    const { data } = await query;
    
    if (data) {
      // If "all", aggregate scores by user
      if (selectedGame === "all") {
        const aggregated: Record<string, LeaderboardEntry> = {};
        data.forEach((entry: any) => {
          if (!aggregated[entry.user_id]) {
            aggregated[entry.user_id] = {
              user_id: entry.user_id,
              game_id: "all",
              score: 0,
              username: entry.profiles?.username,
              avatar_url: entry.profiles?.avatar_url,
            };
          }
          aggregated[entry.user_id].score += entry.score;
        });
        
        const sorted = Object.values(aggregated)
          .sort((a, b) => b.score - a.score)
          .slice(0, compact ? 5 : 50)
          .map((e, i) => ({ ...e, rank: i + 1 }));
        
        setEntries(sorted);
        
        if (user) {
          const userEntry = sorted.find((e) => e.user_id === user.id);
          setUserRank(userEntry?.rank || null);
        }
      } else {
        const mapped = data.map((entry: any, i: number) => ({
          user_id: entry.user_id,
          game_id: entry.game_id,
          score: entry.score,
          username: entry.profiles?.username,
          avatar_url: entry.profiles?.avatar_url,
          rank: i + 1,
        }));
        
        setEntries(mapped);
        
        if (user) {
          const userEntry = mapped.find((e) => e.user_id === user.id);
          setUserRank(userEntry?.rank || null);
        }
      }
    }
    
    setLoading(false);
  };

  return (
    <Card className="glass-effect">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!compact && (
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-3">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedGame === game.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {game.emoji} {game.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(compact ? 3 : 5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No scores yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <motion.div
                key={`${entry.user_id}-${entry.game_id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  entry.user_id === user?.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/30"
                } ${entry.rank === 1 ? "ring-2 ring-yellow-500/50" : ""}`}
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(entry.rank || index + 1)}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback>
                    {entry.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">
                    {entry.username || "Anonymous"}
                    {entry.user_id === user?.id && (
                      <span className="text-primary ml-1">(You)</span>
                    )}
                  </p>
                </div>
                <div className="font-bold text-primary">
                  {entry.score.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {userRank && userRank > (compact ? 5 : 10) && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Your rank: <span className="font-bold text-primary">#{userRank}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;