import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { User, Search, Upload, LogOut, ChevronDown, Flame, Heart, Trophy, Clock, Gamepad2, Mic, Quote, GraduationCap, ClipboardList, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import AnimatedAvatar from "./AnimatedAvatar";
import { SportIcon } from "./SportIcon";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { t } = useTranslation();
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

  const categories = [
    { name: t("sidebar.trending"), icon: Flame, path: "/trending" },
    { name: t("sidebar.fans"), icon: Heart, path: "/fans" },
    { name: t("sidebar.topPlays"), icon: Trophy, path: "/top-plays" },
    { name: t("sidebar.watchLater"), icon: Clock, path: "/watch-later" },
    { name: t("sidebar.games"), icon: Gamepad2, path: "/games" },
    { name: t("sidebar.podcasts"), icon: Mic, path: "/podcasts" },
    { name: t("sidebar.quotes"), icon: Quote, path: "/motivation" },
    { name: t("sidebar.recruiting"), icon: GraduationCap, path: "/recruiting" },
    { name: "Recruiter Dashboard", icon: ClipboardList, path: "/recruiter-dashboard" },
    { name: "Marketplace", icon: ShoppingBag, path: "/marketplace" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect shadow-steel">
      <div className="mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <NavLink to="/" end className="text-xl md:text-2xl font-display font-bold gradient-text tracking-tight hover:opacity-80 transition-opacity">
              USportz
            </NavLink>
            
            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                  <span className="hidden sm:inline">Categories</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56 bg-popover border-border z-50"
              >
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category.path}
                    onClick={() => navigate(category.path)}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <category.icon className="mr-2 h-4 w-4" />
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/search")}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <LanguageSwitcher />
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="hidden md:flex border-primary text-foreground">
                  <Upload className="mr-2 h-4 w-4" />
                  {t("nav.upload")}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="relative">
                        <AnimatedAvatar
                          videoUrl={profile?.profile_video_url}
                          imageUrl={profile?.avatar_url || user.user_metadata?.avatar_url}
                          fallback={profile?.username?.[0] || user.user_metadata?.username?.[0] || "U"}
                          className="h-6 w-6"
                        />
                        {profile?.sports && profile.sports.length > 0 && (
                          <SportIcon sportId={profile.sports[0]} className="w-4 h-4 p-0.5" />
                        )}
                      </div>
                      <span className="hidden md:inline">{profile?.username || user.user_metadata?.username || t("nav.profile")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      {t("nav.viewProfile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("nav.signOut")}
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
                <span className="hidden md:inline">{t("nav.signIn")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
