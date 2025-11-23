import { Button } from "@/components/ui/button";
import { User, Search, Upload, Menu, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SportIcon } from "./SportIcon";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect shadow-steel">
      <div className="mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            
            <h1 className="text-xl md:text-2xl font-display font-bold gradient-text tracking-tight">
              U⚡️Sportz
            </h1>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search sports, athletes, highlights..." 
                className="pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="hidden md:flex border-primary text-foreground">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
                          <AvatarFallback>{profile?.username?.[0] || user.user_metadata?.username?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        {profile?.sports && profile.sports.length > 0 && (
                          <SportIcon sportId={profile.sports[0]} className="w-4 h-4 p-0.5" />
                        )}
                      </div>
                      <span className="hidden md:inline">{profile?.username || user.user_metadata?.username || "Profile"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/auth")}
              >
                <User className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
