import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SportIcon } from "./SportIcon";

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    sports: string[] | null;
  };
}

const Stories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      const { data } = await supabase
        .from("stories")
        .select(`
          *,
          profiles (
            username,
            avatar_url,
            sports
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setStories(data as Story[]);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="glass-effect rounded-xl shadow-card p-4 mb-6 animate-fade-in">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create Story */}
        <div className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-border group-hover:border-primary group-hover:shadow-glow transition-all duration-300">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <span className="text-xs text-center text-muted-foreground font-medium">Create</span>
        </div>

        {/* User Stories */}
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-power p-[3px] group-hover:shadow-glow transition-all duration-300 animate-pulse-glow">
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage src={story.profiles.avatar_url || undefined} alt={story.profiles.username} />
                  <AvatarFallback>{story.profiles.username[0]}</AvatarFallback>
                </Avatar>
              </div>
              {story.profiles.sports && story.profiles.sports.length > 0 && (
                <SportIcon sportId={story.profiles.sports[0]} />
              )}
            </div>
            <span className="text-xs text-center line-clamp-1 max-w-[80px] font-medium">
              {story.profiles.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
