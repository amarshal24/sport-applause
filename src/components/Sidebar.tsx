import { Home, Flame, Compass, Upload, User, TrendingUp, Users, Trophy, Clock, Gamepad2, MessageCircle, Film, GraduationCap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-card/50 backdrop-blur-lg border-r border-border p-4 hidden lg:block overflow-y-auto">
      <div className="space-y-1">
        <NavLink 
          to="/" 
          end 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>

        <NavLink 
          to="/trending" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Flame className="h-5 w-5" />
          <span>Trending</span>
        </NavLink>

        <NavLink 
          to="/discover" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Compass className="h-5 w-5" />
          <span>Discover</span>
        </NavLink>

        <NavLink 
          to="/following" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Users className="h-5 w-5" />
          <span>Following</span>
        </NavLink>
      </div>

      <div className="border-t border-border my-4" />

      <div className="space-y-1">
        <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">Categories</p>
        
        <NavLink 
          to="/recruiting" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <GraduationCap className="h-5 w-5" />
          <span>Get Recruited</span>
        </NavLink>

        <NavLink 
          to="/motivation" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Daily Motivation</span>
        </NavLink>

        <NavLink 
          to="/games" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Gamepad2 className="h-5 w-5" />
          <span>Games</span>
        </NavLink>

        <NavLink 
          to="/top-plays" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Trophy className="h-5 w-5" />
          <span>Top Plays</span>
        </NavLink>

        <NavLink 
          to="/live" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <TrendingUp className="h-5 w-5" />
          <span>Live</span>
        </NavLink>

        <NavLink 
          to="/watch-later" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Clock className="h-5 w-5" />
          <span>Watch Later</span>
        </NavLink>
      </div>

      <div className="border-t border-border my-4" />

      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => window.location.href = '/editor'}>
        <Film className="mr-2 h-4 w-4" />
        Create Video
      </Button>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">Join You Sports</p>
        <p className="text-sm mb-3">Share your best sports moments with the world!</p>
        <Button variant="outline" size="sm" className="w-full">
          <User className="mr-2 h-4 w-4" />
          Sign Up
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
