import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

const MOCK_STORIES = [
  {
    id: 1,
    username: "CourtKing23",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80",
    hasStory: true,
  },
  {
    id: 2,
    username: "GridironGuru",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
    hasStory: true,
  },
  {
    id: 3,
    username: "FootyFanatic",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80",
    hasStory: true,
  },
  {
    id: 4,
    username: "DiamondPro",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    hasStory: true,
  },
  {
    id: 5,
    username: "FitCoachMike",
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&q=80",
    hasStory: true,
  },
];

const Stories = () => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4 mb-6">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create Story */}
        <div className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border group-hover:border-primary transition-colors">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            </div>
          </div>
          <span className="text-xs text-center text-muted-foreground">Create</span>
        </div>

        {/* User Stories */}
        {MOCK_STORIES.map((story) => (
          <div
            key={story.id}
            className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent p-[2px]">
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage src={story.avatar} alt={story.username} />
                  <AvatarFallback>{story.username[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-center line-clamp-1 max-w-[80px]">
              {story.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
