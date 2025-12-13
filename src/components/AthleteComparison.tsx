import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  GitCompare,
  Search,
  X,
  Ruler,
  Weight,
  School,
  MapPin,
  Calendar,
  Eye,
  Trophy,
  Plus,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AthleteData {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  sport: string;
  position: string | null;
  height: string | null;
  weight: string | null;
  graduation_year: number | null;
  school: string | null;
  location: string | null;
  views_count: number;
  video_count: number;
}

interface SearchResult {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  sport: string;
  position: string | null;
}

const AthleteComparison = () => {
  const navigate = useNavigate();
  const [selectedAthletes, setSelectedAthletes] = useState<AthleteData[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const searchBasketballAthletes = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("recruiting_videos")
        .select(`
          user_id,
          sport,
          position,
          profiles!inner (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("status", "active")
        .eq("sport", "Basketball")
        .or(`profiles.username.ilike.%${query}%,profiles.full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Dedupe by user_id
      const uniqueAthletes = new Map<string, SearchResult>();
      data?.forEach((item) => {
        if (!uniqueAthletes.has(item.user_id)) {
          const profiles = item.profiles as unknown as {
            username: string;
            full_name: string | null;
            avatar_url: string | null;
          };
          uniqueAthletes.set(item.user_id, {
            user_id: item.user_id,
            username: profiles.username,
            full_name: profiles.full_name,
            avatar_url: profiles.avatar_url,
            sport: item.sport,
            position: item.position,
          });
        }
      });

      setSearchResults(Array.from(uniqueAthletes.values()));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const addAthlete = async (result: SearchResult) => {
    if (selectedAthletes.length >= 4) {
      toast.error("Maximum 4 athletes can be compared");
      return;
    }

    if (selectedAthletes.find((a) => a.user_id === result.user_id)) {
      toast.info("Athlete already added");
      return;
    }

    try {
      // Fetch full athlete data
      const { data, error } = await supabase
        .from("recruiting_videos")
        .select(`
          user_id,
          sport,
          position,
          height,
          weight,
          graduation_year,
          school,
          location,
          views_count,
          profiles!inner (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("user_id", result.user_id)
        .eq("status", "active")
        .eq("sport", "Basketball");

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("Could not load athlete data");
        return;
      }

      // Aggregate data from all videos
      const profiles = data[0].profiles as unknown as {
        id: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
      };

      const totalViews = data.reduce((sum, v) => sum + v.views_count, 0);
      const latestVideo = data[0];

      const athleteData: AthleteData = {
        id: profiles.id,
        user_id: result.user_id,
        username: profiles.username,
        full_name: profiles.full_name,
        avatar_url: profiles.avatar_url,
        sport: latestVideo.sport,
        position: latestVideo.position,
        height: latestVideo.height,
        weight: latestVideo.weight,
        graduation_year: latestVideo.graduation_year,
        school: latestVideo.school,
        location: latestVideo.location,
        views_count: totalViews,
        video_count: data.length,
      };

      setSelectedAthletes((prev) => [...prev, athleteData]);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      toast.success(`Added ${profiles.full_name || profiles.username}`);
    } catch (error) {
      console.error("Error adding athlete:", error);
      toast.error("Failed to add athlete");
    }
  };

  const removeAthlete = (userId: string) => {
    setSelectedAthletes((prev) => prev.filter((a) => a.user_id !== userId));
  };

  const clearAll = () => {
    setSelectedAthletes([]);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchBasketballAthletes(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const parseHeight = (height: string | null): number => {
    if (!height) return 0;
    const match = height.match(/(\d+)'(\d+)"/);
    if (match) {
      return parseInt(match[1]) * 12 + parseInt(match[2]);
    }
    return 0;
  };

  const parseWeight = (weight: string | null): number => {
    if (!weight) return 0;
    const match = weight.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getStatComparison = (athletes: AthleteData[], getValue: (a: AthleteData) => number) => {
    const values = athletes.map(getValue);
    const max = Math.max(...values);
    return values.map((v) => (v === max && v > 0 ? "best" : "normal"));
  };

  return (
    <Card className="glass-effect">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            NBA Athlete Comparison
          </CardTitle>
          {selectedAthletes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedAthletes.length === 0 ? (
          <div className="text-center py-8">
            <GitCompare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Compare Basketball Athletes</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add up to 4 basketball athletes to compare their stats side by side
            </p>
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Athlete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Search Basketball Athletes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <ScrollArea className="h-[300px]">
                    {searching ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No basketball athletes found" : "Start typing to search"}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((result) => (
                          <div
                            key={result.user_id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => addAthlete(result)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={result.avatar_url || undefined} />
                              <AvatarFallback>
                                {result.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {result.full_name || result.username}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                @{result.username}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {result.sport}
                              </Badge>
                              {result.position && (
                                <Badge variant="outline" className="text-xs">
                                  {result.position}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Athlete Cards Row */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {selectedAthletes.map((athlete) => (
                <Card key={athlete.user_id} className="flex-shrink-0 w-48 relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => removeAthlete(athlete.user_id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <CardContent className="p-4 text-center">
                    <Avatar
                      className="h-16 w-16 mx-auto mb-2 cursor-pointer"
                      onClick={() => navigate(`/athlete/${athlete.user_id}`)}
                    >
                      <AvatarImage src={athlete.avatar_url || undefined} />
                      <AvatarFallback>
                        {athlete.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold truncate text-sm">
                      {athlete.full_name || athlete.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{athlete.username}
                    </p>
                    {athlete.position && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {athlete.position}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}

              {selectedAthletes.length < 4 && (
                <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                  <DialogTrigger asChild>
                    <Card className="flex-shrink-0 w-48 cursor-pointer hover:border-primary/50 transition-colors">
                      <CardContent className="p-4 h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Plus className="w-8 h-8 mb-2" />
                        <span className="text-sm">Add Athlete</span>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Search Basketball Athletes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <ScrollArea className="h-[300px]">
                        {searching ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Searching...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? "No basketball athletes found" : "Start typing to search"}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {searchResults.map((result) => (
                              <div
                                key={result.user_id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => addAthlete(result)}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={result.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {result.username[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {result.full_name || result.username}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    @{result.username}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {result.sport}
                                  </Badge>
                                  {result.position && (
                                    <Badge variant="outline" className="text-xs">
                                      {result.position}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Comparison Table */}
            {selectedAthletes.length >= 2 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Stat</th>
                      {selectedAthletes.map((athlete) => (
                        <th key={athlete.user_id} className="text-center py-2 px-3 font-medium">
                          {athlete.full_name?.split(" ")[0] || athlete.username}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        Position
                      </td>
                      {selectedAthletes.map((athlete) => (
                        <td key={athlete.user_id} className="text-center py-2 px-3">
                          {athlete.position || "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        Height
                      </td>
                      {(() => {
                        const heightComparison = getStatComparison(selectedAthletes, (a) =>
                          parseHeight(a.height)
                        );
                        return selectedAthletes.map((athlete, i) => (
                          <td
                            key={athlete.user_id}
                            className={`text-center py-2 px-3 ${
                              heightComparison[i] === "best" ? "text-primary font-semibold" : ""
                            }`}
                          >
                            {athlete.height || "-"}
                          </td>
                        ));
                      })()}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <Weight className="w-4 h-4 text-muted-foreground" />
                        Weight
                      </td>
                      {(() => {
                        const weightComparison = getStatComparison(selectedAthletes, (a) =>
                          parseWeight(a.weight)
                        );
                        return selectedAthletes.map((athlete, i) => (
                          <td
                            key={athlete.user_id}
                            className={`text-center py-2 px-3 ${
                              weightComparison[i] === "best" ? "text-primary font-semibold" : ""
                            }`}
                          >
                            {athlete.weight || "-"}
                          </td>
                        ));
                      })()}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Grad Year
                      </td>
                      {selectedAthletes.map((athlete) => (
                        <td key={athlete.user_id} className="text-center py-2 px-3">
                          {athlete.graduation_year || "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <School className="w-4 h-4 text-muted-foreground" />
                        School
                      </td>
                      {selectedAthletes.map((athlete) => (
                        <td key={athlete.user_id} className="text-center py-2 px-3 truncate max-w-[120px]">
                          {athlete.school || "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        Location
                      </td>
                      {selectedAthletes.map((athlete) => (
                        <td key={athlete.user_id} className="text-center py-2 px-3 truncate max-w-[120px]">
                          {athlete.location || "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        Total Views
                      </td>
                      {(() => {
                        const viewsComparison = getStatComparison(selectedAthletes, (a) => a.views_count);
                        return selectedAthletes.map((athlete, i) => (
                          <td
                            key={athlete.user_id}
                            className={`text-center py-2 px-3 ${
                              viewsComparison[i] === "best" ? "text-primary font-semibold" : ""
                            }`}
                          >
                            {athlete.views_count.toLocaleString()}
                          </td>
                        ));
                      })()}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Videos
                      </td>
                      {(() => {
                        const videoComparison = getStatComparison(selectedAthletes, (a) => a.video_count);
                        return selectedAthletes.map((athlete, i) => (
                          <td
                            key={athlete.user_id}
                            className={`text-center py-2 px-3 ${
                              videoComparison[i] === "best" ? "text-primary font-semibold" : ""
                            }`}
                          >
                            {athlete.video_count}
                          </td>
                        ));
                      })()}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {selectedAthletes.length === 1 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Add at least one more athlete to compare
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AthleteComparison;
