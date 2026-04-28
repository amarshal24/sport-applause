import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SportIcon } from "./SportIcon";
import StoryViewer from "./StoryViewer";

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    sports: string[] | null;
  };
}

interface StoriesProps {
  onCreateStory?: () => void;
}

const Stories = ({ onCreateStory }: StoriesProps) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

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

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="glass-effect rounded-xl shadow-card p-4 mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-foreground">Story Feed</h2>
          {stories.length > 0 && (
            <span className="text-xs text-muted-foreground">{stories.length} active</span>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {stories.length === 0 ? (
            <div className="flex-1 text-center text-xs text-muted-foreground py-6">
              No active stories yet. Check back soon!
            </div>
          ) : (
            stories.map((story, index) => (
              <div
                key={story.id}
                className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
                onClick={() => handleStoryClick(index)}
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
            ))
          )}
        </div>
      </div>

      <StoryViewer
        stories={stories}
        initialIndex={selectedStoryIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </>
  );
};

export default Stories;