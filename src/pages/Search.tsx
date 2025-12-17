import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import AthleteSearch from "@/components/AthleteSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Users, Video, Mic, Hash } from "lucide-react";

const Search = () => {
  const { t } = useTranslation();
  const [generalQuery, setGeneralQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-2">Search</h1>
          <p className="text-muted-foreground mb-8">Find athletes, videos, podcasts, and more</p>

          <Tabs defaultValue="athletes" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="athletes" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Athletes</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Videos</span>
              </TabsTrigger>
              <TabsTrigger value="podcasts" className="gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Podcasts</span>
              </TabsTrigger>
              <TabsTrigger value="tags" className="gap-2">
                <Hash className="h-4 w-4" />
                <span className="hidden sm:inline">Tags</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="athletes" className="space-y-4">
              <AthleteSearch 
                placeholder="Search athletes by name or username..."
                className="w-full"
              />
              <p className="text-sm text-muted-foreground text-center mt-8">
                Search for athletes to view their profiles and recruiting videos
              </p>
            </TabsContent>

            <TabsContent value="videos" className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={generalQuery}
                  onChange={(e) => setGeneralQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-8">
                Search recruiting videos, highlights, and top plays
              </p>
            </TabsContent>

            <TabsContent value="podcasts" className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search podcasts..."
                  value={generalQuery}
                  onChange={(e) => setGeneralQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-8">
                Discover sports podcasts and audio content
              </p>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags (e.g., basketball, football)..."
                  value={generalQuery}
                  onChange={(e) => setGeneralQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-8">
                Browse content by sport or category tags
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Search;
