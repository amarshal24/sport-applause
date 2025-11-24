import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MusicRecommendation {
  artist: string;
  title: string;
  genre: string;
  description: string;
}

export const useMusicRecommendations = () => {
  const [recommendations, setRecommendations] = useState<MusicRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecommendations = async (mood?: string, sport?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('music-recommendations', {
        body: { mood, sport }
      });

      if (error) {
        if (error.message.includes("429")) {
          toast({
            title: "Rate limit exceeded",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive"
          });
        } else if (error.message.includes("402")) {
          toast({
            title: "Credits required",
            description: "Please add credits to continue using AI features.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.songs) {
        setRecommendations(data.songs);
      } else {
        toast({
          title: "No recommendations",
          description: "Try selecting a different mood or sport.",
        });
      }
    } catch (error) {
      console.error("Error fetching music recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch music recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading, fetchRecommendations };
};
