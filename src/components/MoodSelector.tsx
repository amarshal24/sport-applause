import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicRecommendations } from "@/hooks/useMusicRecommendations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getSportIcon } from "@/constants/sports";

interface Mood {
  id: string;
  emoji: string;
  label: string;
  color: string;
  gradient: string;
}

const moods: Mood[] = [
  {
    id: "energetic",
    emoji: "⚡",
    label: "Energetic",
    color: "text-yellow-500",
    gradient: "from-yellow-400 to-orange-500"
  },
  {
    id: "chill",
    emoji: "😌",
    label: "Chill",
    color: "text-blue-500",
    gradient: "from-blue-400 to-cyan-500"
  },
  {
    id: "motivated",
    emoji: "💪",
    label: "Motivated",
    color: "text-red-500",
    gradient: "from-red-400 to-pink-500"
  },
  {
    id: "focused",
    emoji: "🎯",
    label: "Focused",
    color: "text-purple-500",
    gradient: "from-purple-400 to-indigo-500"
  },
  {
    id: "victorious",
    emoji: "🏆",
    label: "Victorious",
    color: "text-green-500",
    gradient: "from-green-400 to-emerald-500"
  },
  {
    id: "pumped",
    emoji: "🔥",
    label: "Pumped Up",
    color: "text-orange-500",
    gradient: "from-orange-400 to-red-500"
  },
];

const MoodSelector = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [userSport, setUserSport] = useState<string | null>(null);
  const { fetchRecommendations, loading } = useMusicRecommendations();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserSport = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("sports")
        .eq("id", user.id)
        .single();
      
      if (data?.sports && data.sports.length > 0) {
        setUserSport(data.sports[0]);
      }
    };

    fetchUserSport();
  }, [user]);

  const SportIcon = userSport ? getSportIcon(userSport) : Music;

  const handleSetVibe = () => {
    if (selectedMood) {
      fetchRecommendations(selectedMood);
    }
  };

  return (
    <Card className="glass-effect animate-fade-in mb-6 max-w-5xl mx-auto w-full">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <SportIcon className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">What's on your mind today?</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {moods.map((mood) => (
            <Button
              key={mood.id}
              variant="outline"
              onClick={() => setSelectedMood(mood.id)}
              className={cn(
                "h-auto py-4 px-3 flex flex-col items-center gap-2 transition-all duration-300 hover-lift relative overflow-hidden group",
                selectedMood === mood.id && "border-primary shadow-glow"
              )}
            >
              {selectedMood === mood.id && (
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-10",
                  mood.gradient
                )} />
              )}
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {mood.emoji}
              </span>
              <span className={cn(
                "text-xs font-medium",
                selectedMood === mood.id ? mood.color : "text-muted-foreground"
              )}>
                {mood.label}
              </span>
            </Button>
          ))}
        </div>

        {selectedMood && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary animate-pulse-glow" />
              <span className="text-sm font-medium">
                Feeling {moods.find(m => m.id === selectedMood)?.label.toLowerCase()}!
              </span>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              className="gap-1 text-primary hover:text-primary/90"
              onClick={handleSetVibe}
              disabled={loading}
            >
              {loading ? "Loading..." : "Get Music"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodSelector;
