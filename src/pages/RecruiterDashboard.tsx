import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Star,
  User,
  Calendar,
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  Mail,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface RatedAthlete {
  id: string;
  athlete_id: string;
  interest_level: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    sports: string[] | null;
  } | null;
}

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ratedAthletes, setRatedAthletes] = useState<RatedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editLevel, setEditLevel] = useState<number>(3);

  useEffect(() => {
    if (user) {
      fetchRatedAthletes();
    }
  }, [user]);

  const fetchRatedAthletes = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("recruiter_interests")
        .select("*")
        .eq("recruiter_id", user.id);

      if (error) throw error;

      // Fetch profiles for each athlete
      const athleteIds = data?.map((item) => item.athlete_id) || [];
      
      if (athleteIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, sports")
          .in("id", athleteIds);

        if (profilesError) throw profilesError;

        const athletesWithProfiles = data?.map((item) => ({
          ...item,
          profile: profiles?.find((p) => p.id === item.athlete_id) || null,
        })) || [];

        setRatedAthletes(athletesWithProfiles);
      } else {
        setRatedAthletes([]);
      }
    } catch (error) {
      console.error("Error fetching rated athletes:", error);
      toast.error("Failed to load rated athletes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this athlete from your list?")) return;

    try {
      const { error } = await supabase
        .from("recruiter_interests")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Athlete removed from list");
      setRatedAthletes((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to remove athlete");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from("recruiter_interests")
        .update({
          interest_level: editLevel,
          notes: editNotes || null,
        })
        .eq("id", editingId);

      if (error) throw error;
      toast.success("Updated successfully");
      setEditingId(null);
      fetchRatedAthletes();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const openEditDialog = (athlete: RatedAthlete) => {
    setEditingId(athlete.id);
    setEditLevel(athlete.interest_level);
    setEditNotes(athlete.notes || "");
  };

  // Filter and sort
  const filteredAthletes = ratedAthletes
    .filter((athlete) => {
      const matchesSearch =
        !searchQuery ||
        athlete.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel =
        filterLevel === "all" || athlete.interest_level === parseInt(filterLevel);

      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "highest":
          return b.interest_level - a.interest_level;
        case "lowest":
          return a.interest_level - b.interest_level;
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const interestLabels: Record<number, { label: string; color: string }> = {
    1: { label: "Low Interest", color: "bg-muted text-muted-foreground" },
    2: { label: "Some Interest", color: "bg-blue-500/20 text-blue-500" },
    3: { label: "Moderate", color: "bg-yellow-500/20 text-yellow-500" },
    4: { label: "High Interest", color: "bg-orange-500/20 text-orange-500" },
    5: { label: "Top Prospect", color: "bg-green-500/20 text-green-500" },
  };

  const stats = {
    total: ratedAthletes.length,
    topProspects: ratedAthletes.filter((a) => a.interest_level === 5).length,
    highInterest: ratedAthletes.filter((a) => a.interest_level >= 4).length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
          <div className="px-4 lg:px-6 py-6">
            <Card className="glass-effect">
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
                <p className="text-muted-foreground mb-4">
                  Please sign in to access the recruiter dashboard.
                </p>
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />

      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2">
              Recruiter Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage and track athletes you're interested in recruiting.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="glass-effect">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Athletes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/20">
                  <Star className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.topProspects}</p>
                  <p className="text-sm text-muted-foreground">Top Prospects</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500/20">
                  <Star className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.highInterest}</p>
                  <p className="text-sm text-muted-foreground">High Interest</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="glass-effect mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search athletes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="5">Top Prospects (5)</SelectItem>
                      <SelectItem value="4">High Interest (4)</SelectItem>
                      <SelectItem value="3">Moderate (3)</SelectItem>
                      <SelectItem value="2">Some Interest (2)</SelectItem>
                      <SelectItem value="1">Low Interest (1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="highest">Highest Interest</SelectItem>
                      <SelectItem value="lowest">Lowest Interest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(searchQuery || filterLevel !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterLevel("all");
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Athletes List */}
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-effect animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAthletes.length === 0 ? (
            <Card className="glass-effect">
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {ratedAthletes.length === 0 ? "No Athletes Rated Yet" : "No Results"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {ratedAthletes.length === 0
                    ? "Visit athlete profiles and use the interest scale to start tracking prospects."
                    : "Try adjusting your filters to find athletes."}
                </p>
                {ratedAthletes.length === 0 && (
                  <Button onClick={() => navigate("/recruiting")}>
                    Browse Athletes
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAthletes.map((athlete) => (
                <Card
                  key={athlete.id}
                  className="glass-effect hover:shadow-glow transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar
                        className="h-14 w-14 cursor-pointer"
                        onClick={() => navigate(`/athlete/${athlete.athlete_id}`)}
                      >
                        <AvatarImage src={athlete.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {athlete.profile?.username?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/athlete/${athlete.athlete_id}`)}
                          >
                            {athlete.profile?.full_name || athlete.profile?.username || "Unknown"}
                          </h3>
                          <Badge
                            className={`${
                              interestLabels[athlete.interest_level]?.color
                            } border-0`}
                          >
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            {interestLabels[athlete.interest_level]?.label}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          @{athlete.profile?.username}
                        </p>

                        {athlete.profile?.sports && athlete.profile.sports.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {athlete.profile.sports.map((sport) => (
                              <Badge key={sport} variant="outline" className="text-xs">
                                {sport}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {athlete.notes && (
                          <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg mb-2">
                            {athlete.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Added {format(new Date(athlete.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/athlete/${athlete.athlete_id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(athlete)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(athlete.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Interest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Interest Level</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant={editLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditLevel(level)}
                    className="flex-1"
                  >
                    <Star
                      className={`w-4 h-4 ${editLevel >= level ? "fill-current" : ""}`}
                    />
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {interestLabels[editLevel]?.label}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this athlete..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecruiterDashboard;
