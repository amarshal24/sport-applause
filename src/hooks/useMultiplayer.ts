import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface MultiplayerMatch {
  id: string;
  game_id: string;
  host_id: string;
  guest_id: string | null;
  host_score: number;
  guest_score: number;
  status: 'waiting' | 'playing' | 'finished';
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  host_profile?: {
    username: string;
    avatar_url: string | null;
  };
  guest_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useMultiplayer = (gameId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMatch, setCurrentMatch] = useState<MultiplayerMatch | null>(null);
  const [availableMatches, setAvailableMatches] = useState<MultiplayerMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available matches for this game
  const fetchAvailableMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('multiplayer_matches')
      .select('*')
      .eq('game_id', gameId)
      .eq('status', 'waiting')
      .is('guest_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching matches:', error);
      return;
    }

    // Fetch host profiles
    const matchesWithProfiles = await Promise.all(
      (data || []).map(async (match) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', match.host_id)
          .single();
        
        return {
          ...match,
          host_profile: profile || undefined
        } as MultiplayerMatch;
      })
    );

    setAvailableMatches(matchesWithProfiles.filter(m => m.host_id !== user?.id));
  }, [gameId, user?.id]);

  // Create a new match
  const createMatch = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to create a multiplayer match',
        variant: 'destructive'
      });
      return null;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('multiplayer_matches')
      .insert({
        game_id: gameId,
        host_id: user.id,
        status: 'waiting'
      })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error('Error creating match:', error);
      toast({
        title: 'Error',
        description: 'Failed to create match',
        variant: 'destructive'
      });
      return null;
    }

    setCurrentMatch(data as MultiplayerMatch);
    toast({
      title: 'Match created!',
      description: 'Waiting for an opponent to join...'
    });
    return data;
  }, [gameId, user, toast]);

  // Join an existing match
  const joinMatch = useCallback(async (matchId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to join a match',
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('multiplayer_matches')
      .update({
        guest_id: user.id,
        status: 'playing',
        started_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .eq('status', 'waiting')
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error('Error joining match:', error);
      toast({
        title: 'Error',
        description: 'Failed to join match',
        variant: 'destructive'
      });
      return false;
    }

    setCurrentMatch(data as MultiplayerMatch);
    toast({
      title: 'Joined match!',
      description: 'Game starting...'
    });
    return true;
  }, [user, toast]);

  // Update score during match
  const updateScore = useCallback(async (score: number) => {
    if (!currentMatch || !user) return;

    const isHost = currentMatch.host_id === user.id;
    const updateData = isHost 
      ? { host_score: score }
      : { guest_score: score };

    const { error } = await supabase
      .from('multiplayer_matches')
      .update(updateData)
      .eq('id', currentMatch.id);

    if (error) {
      console.error('Error updating score:', error);
    }
  }, [currentMatch, user]);

  // End the match
  const endMatch = useCallback(async (finalScore: number) => {
    if (!currentMatch || !user) return;

    const isHost = currentMatch.host_id === user.id;
    const myScore = finalScore;
    const opponentScore = isHost ? currentMatch.guest_score : currentMatch.host_score;
    
    let winnerId = null;
    if (myScore > opponentScore) {
      winnerId = user.id;
    } else if (opponentScore > myScore) {
      winnerId = isHost ? currentMatch.guest_id : currentMatch.host_id;
    }

    const updateData = {
      ...(isHost ? { host_score: finalScore } : { guest_score: finalScore }),
      status: 'finished',
      winner_id: winnerId,
      ended_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('multiplayer_matches')
      .update(updateData)
      .eq('id', currentMatch.id);

    if (error) {
      console.error('Error ending match:', error);
    }
  }, [currentMatch, user]);

  // Leave/cancel match
  const leaveMatch = useCallback(async () => {
    if (!currentMatch) return;

    if (currentMatch.status === 'waiting') {
      await supabase
        .from('multiplayer_matches')
        .delete()
        .eq('id', currentMatch.id);
    }
    
    setCurrentMatch(null);
  }, [currentMatch]);

  // Subscribe to match updates
  useEffect(() => {
    if (!currentMatch) return;

    const channel = supabase
      .channel(`match-${currentMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_matches',
          filter: `id=eq.${currentMatch.id}`
        },
        (payload) => {
          console.log('Match update:', payload);
          if (payload.new) {
            setCurrentMatch(payload.new as MultiplayerMatch);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentMatch?.id]);

  // Subscribe to available matches updates
  useEffect(() => {
    fetchAvailableMatches();

    const channel = supabase
      .channel(`matches-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_matches',
          filter: `game_id=eq.${gameId}`
        },
        () => {
          fetchAvailableMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchAvailableMatches]);

  return {
    currentMatch,
    availableMatches,
    isLoading,
    createMatch,
    joinMatch,
    updateScore,
    endMatch,
    leaveMatch,
    fetchAvailableMatches
  };
};
