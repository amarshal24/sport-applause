import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SportIcon } from "@/components/SportIcon";
import { Card, CardContent } from "@/components/ui/card";
import { getSportName } from "@/constants/sports";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <main className="pt-20 lg:pl-64">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="animate-pulse">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-4xl">
                      {profile?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {profile?.sports && profile.sports.length > 0 && (
                    <SportIcon 
                      sportId={profile.sports[0]} 
                      className="absolute -bottom-2 -right-2 w-12 h-12 p-2 border-4"
                    />
                  )}
                </div>

                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {profile?.username}
                  </h1>
                  {profile?.full_name && (
                    <p className="text-lg text-muted-foreground">
                      {profile.full_name}
                    </p>
                  )}
                  {profile?.bio && (
                    <p className="text-muted-foreground max-w-2xl">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {profile?.sports && profile.sports.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profile.sports.map((sportId: string) => (
                      <Badge 
                        key={sportId} 
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        {getSportName(sportId)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
