import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Loader2, Swords, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayer, MultiplayerMatch } from '@/hooks/useMultiplayer';
import { useAuth } from '@/hooks/useAuth';

interface MultiplayerLobbyProps {
  gameId: string;
  gameName: string;
  onStartMatch: (match: MultiplayerMatch) => void;
  onBack: () => void;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  gameId,
  gameName,
  onStartMatch,
  onBack
}) => {
  const { user } = useAuth();
  const {
    currentMatch,
    availableMatches,
    isLoading,
    createMatch,
    joinMatch,
    leaveMatch
  } = useMultiplayer(gameId);

  // If we have a match that's playing, start the game
  React.useEffect(() => {
    if (currentMatch?.status === 'playing') {
      onStartMatch(currentMatch);
    }
  }, [currentMatch?.status, currentMatch, onStartMatch]);

  const handleCreateMatch = async () => {
    await createMatch();
  };

  const handleJoinMatch = async (matchId: string) => {
    const success = await joinMatch(matchId);
    if (success) {
      // Match will update via realtime subscription
    }
  };

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground mb-4">
            Please sign in to play multiplayer matches
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Waiting for opponent
  if (currentMatch?.status === 'waiting') {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mb-6"
          >
            <Swords className="w-20 h-20 mx-auto text-primary" />
          </motion.div>
          <h3 className="text-2xl font-bold mb-2">Waiting for Opponent</h3>
          <p className="text-muted-foreground mb-6">
            Share this lobby with a friend to start playing!
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg">Searching for players...</span>
          </div>
          <Button onClick={leaveMatch} variant="outline">
            Cancel Match
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{gameName} - Multiplayer</h2>
        <div className="w-20" />
      </div>

      {/* Create Match */}
      <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">Create a Match</h3>
              <p className="text-muted-foreground">
                Start a new match and wait for someone to join
              </p>
            </div>
            <Button 
              onClick={handleCreateMatch} 
              disabled={isLoading}
              size="lg"
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Create Match
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Matches */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Available Matches ({availableMatches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No matches available</p>
              <p className="text-sm">Create one to start playing!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {availableMatches.map((match) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={match.host_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {match.host_profile?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {match.host_profile?.username || 'Unknown Player'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(match.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                        Waiting
                      </Badge>
                      <Button 
                        onClick={() => handleJoinMatch(match.id)}
                        disabled={isLoading}
                        size="sm"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Join'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiplayerLobby;
