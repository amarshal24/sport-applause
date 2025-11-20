import { Button } from "@/components/ui/button";
import { Home, Flame, User, Search, Upload } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AllSports
            </h1>
            
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" className="text-foreground">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button variant="ghost" className="text-foreground">
                <Flame className="mr-2 h-4 w-4" />
                Trending
              </Button>
              <Button variant="ghost" className="text-foreground">
                <Search className="mr-2 h-4 w-4" />
                Discover
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-primary text-foreground">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
