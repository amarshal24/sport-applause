import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MusicRecommendation {
  artist: string;
  title: string;
  genre: string;
  description: string;
}

interface MusicRecommendationsProps {
  recommendations: MusicRecommendation[];
  loading: boolean;
}

const MusicRecommendations = ({ recommendations, loading }: MusicRecommendationsProps) => {
  if (loading) {
    return (
      <Card className="glass-effect animate-fade-in mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Finding perfect tracks for you...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleSpotifySearch = (artist: string, title: string) => {
    const query = encodeURIComponent(`${artist} ${title}`);
    window.open(`https://open.spotify.com/search/${query}`, '_blank');
  };

  const handleAppleMusicSearch = (artist: string, title: string) => {
    const query = encodeURIComponent(`${artist} ${title}`);
    window.open(`https://music.apple.com/search?term=${query}`, '_blank');
  };

  return (
    <Card className="glass-effect animate-fade-in mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Your Workout Playlist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((song, index) => (
            <div
              key={index}
              className="bg-background/50 rounded-lg p-4 border border-border hover:border-primary transition-all hover:shadow-glow group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {song.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {song.genre}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {song.description}
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  onClick={() => handleSpotifySearch(song.artist, song.title)}
                >
                  <ExternalLink className="w-3 h-3" />
                  Spotify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  onClick={() => handleAppleMusicSearch(song.artist, song.title)}
                >
                  <ExternalLink className="w-3 h-3" />
                  Apple Music
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground text-center">
          <Music className="w-4 h-4 inline mr-1" />
          Click the buttons to open these tracks in Spotify or Apple Music
        </div>
      </CardContent>
    </Card>
  );
};

export default MusicRecommendations;
