import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MusicRecommendation {
  artist: string;
  title: string;
  genre: string;
  description: string;
}

interface MusicState {
  recommendations: MusicRecommendation[];
  loading: boolean;
  mood?: string;
  sport?: string;
}

// Shared store so any component can trigger a fetch and every subscriber
// (e.g. the feed's MusicRecommendations card) sees the same results.
let state: MusicState = { recommendations: [], loading: false };
const listeners = new Set<() => void>();

const setState = (patch: Partial<MusicState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;

export const useMusicRecommendations = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { toast } = useToast();

  const fetchRecommendations = async (mood?: string, sport?: string) => {
    setState({ loading: true, mood, sport });
    try {
      const { data, error } = await supabase.functions.invoke("music-recommendations", {
        body: { mood, sport },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast({
            title: "Rate limit exceeded",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive",
          });
        } else if (error.message?.includes("402")) {
          toast({
            title: "Credits required",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      const songs: MusicRecommendation[] = data?.songs ?? data?.recommendations ?? (Array.isArray(data) ? data : []);

      if (songs.length > 0) {
        setState({ recommendations: songs });
        toast({
          title: "Playlist ready",
          description: `${songs.length} tracks picked for your ${mood ?? "workout"} vibe.`,
        });
      } else {
        toast({
          title: "No recommendations",
          description: "Try selecting a different mood or sport.",
        });
      }
    } catch (err) {
      console.error("Error fetching music recommendations:", err);
      toast({
        title: "Error",
        description: "Failed to fetch music recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState({ loading: false });
    }
  };

  const clearRecommendations = () => setState({ recommendations: [] });

  return {
    recommendations: snapshot.recommendations,
    loading: snapshot.loading,
    mood: snapshot.mood,
    sport: snapshot.sport,
    fetchRecommendations,
    clearRecommendations,
  };
};
