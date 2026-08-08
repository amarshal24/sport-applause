import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Heart, Search, Users, Mic, Camera, Trophy, History as HistoryIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { SPORTS, getSportName } from "@/constants/sports";
import { InlineSportIcon } from "@/components/SportIcon";
import { cn } from "@/lib/utils";
import AthleteSearchAutocomplete from "@/components/AthleteSearchAutocomplete";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FriendsPanel from "@/components/friends/FriendsPanel";
import FriendChat from "@/components/friends/FriendChat";
import UserActionsMenu from "@/components/friends/UserActionsMenu";


type Role = "all" | "athlete" | "commentator" | "media";

interface FanProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  sports: string[] | null;
  role: string | null;
}

const ROLES: { id: Role; label: string; icon: typeof Users }[] = [
  { id: "all", label: "All", icon: Users },
  { id: "athlete", label: "Athletes", icon: Trophy },
  { id: "commentator", label: "Commentators", icon: Mic },
  { id: "media", label: "Media", icon: Camera },
];

const Fans = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<Role>("all");
  const [results, setResults] = useState<FanProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { recents, addRecent, clearRecents } = useRecentSearches();
  const [tab, setTab] = useState<"discover" | "friends" | "messages">("discover");
  const [chatWith, setChatWith] = useState<string | undefined>(undefined);

  const openChat = (id: string) => {
    setChatWith(id);
    setTab("messages");
  };

  // Debounce search input by 300ms
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!user) return;

    const fetchProfiles = async () => {
      setLoading(true);
      let req = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, sports, role")
        .neq("id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (selectedRole !== "all") {
        req = req.eq("role", selectedRole);
      }
      if (selectedSport !== "all") {
        req = req.contains("sports", [selectedSport]);
      }
      if (debouncedQuery) {
        req = req.or(
          `username.ilike.%${debouncedQuery}%,full_name.ilike.%${debouncedQuery}%`
        );
      }

      const { data, error } = await req;
      if (!error && data) setResults(data as FanProfile[]);
      setLoading(false);
    };

    fetchProfiles();
  }, [user, debouncedQuery, selectedSport, selectedRole]);

  const roleBadge = useMemo(
    () => (role: string | null) => {
      const r = ROLES.find((x) => x.id === (role as Role));
      if (!r || r.id === "all") return null;
      const Icon = r.icon;
      return (
        <Badge variant="secondary" className="gap-1">
          <Icon className="h-3 w-3" />
          {r.label.replace(/s$/, "")}
        </Badge>
      );
    },
    []
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <MobileNav />
        <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              Sign in to follow athletes as a fan
            </p>
            <Button onClick={() => navigate("/auth")}>{t("nav.signIn")}</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />

      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
        <div className="max-w-5xl mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/10">
              <Heart className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sidebar.fans")}
              </h1>
              <p className="text-muted-foreground">
                Find athletes, commentators, and media to support
              </p>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="friends">
              <FriendsPanel />
            </TabsContent>

            <TabsContent value="messages">
              <FriendChat initialRecipientId={chatWith} />
            </TabsContent>

            <TabsContent value="discover" className="space-y-6">
          {/* Search with autocomplete */}
          <AthleteSearchAutocomplete
            value={query}
            onValueChange={setQuery}
            onSelectSport={(sportId) => {
              setSelectedSport(sportId);
              setQuery("");
            }}
            onSelectAthlete={(a) => navigate(`/athlete/${a.id}`)}
            placeholder="Search athletes by name or sport..."
          />

          {/* Recent searches & filters */}
          {recents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Recent</p>
                <button
                  type="button"
                  onClick={clearRecents}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recents.map((r) => (
                  <Button
                    key={`${r.type}-${r.id}`}
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => {
                      if (r.type === "sport") {
                        setSelectedSport(r.id);
                        addRecent({ type: "sport", id: r.id, label: r.label });
                      } else {
                        navigate(`/athlete/${r.id}`);
                      }
                    }}
                  >
                    {r.type === "sport" ? (
                      <InlineSportIcon sportId={r.id} />
                    ) : (
                      <HistoryIcon className="h-3.5 w-3.5" />
                    )}
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          )}


          {/* Role filter */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = selectedRole === r.id;
                return (
                  <Button
                    key={r.id}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => setSelectedRole(r.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {r.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Sport filter */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Sport</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedSport === "all" ? "default" : "outline"}
                onClick={() => setSelectedSport("all")}
              >
                All Sports
              </Button>
              {SPORTS.map((sport) => {
                const Icon = sport.icon;
                const active = selectedSport === sport.id;
                return (
                  <Button
                    key={sport.id}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => {
                      setSelectedSport(sport.id);
                      addRecent({ type: "sport", id: sport.id, label: sport.name });
                    }}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {sport.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No matches found. Try adjusting your filters.
                </p>
              </div>
            ) : (
              results.map((profile) => (
                <Card
                  key={profile.id}
                  className={cn(
                    "p-4 flex items-center gap-4 cursor-pointer",
                    "hover:bg-muted/50 transition-colors"
                  )}
                  onClick={() => navigate(`/athlete/${profile.id}`)}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {(profile.username || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate">
                        {profile.full_name || profile.username}
                      </p>
                      {profile.sports?.[0] && (
                        <InlineSportIcon sportId={profile.sports[0]} />
                      )}
                      {roleBadge(profile.role)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{profile.username}
                    </p>
                    {profile.sports && profile.sports.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.sports.slice(0, 3).map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="text-xs"
                          >
                            {getSportName(s)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <UserActionsMenu
                    targetId={profile.id}
                    targetName={profile.full_name || profile.username}
                    onMessage={openChat}
                  />
                </Card>
              ))
            )}
          </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Fans;
