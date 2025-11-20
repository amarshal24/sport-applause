import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MessageCircle } from "lucide-react";
import { FilterSelector } from "./FilterSelector";
import { AnimatedFilter, FilterType } from "./AnimatedFilters";

const SPORTS_CATEGORIES = [
  "All Sports",
  "Basketball",
  "Football",
  "Soccer",
  "Baseball",
  "Hockey",
  "Tennis",
  "Boxing",
  "MMA",
  "Media",
  "Fitness",
];

const MOCK_VIDEOS = [
  {
    id: 1,
    sport: "Basketball",
    title: "Incredible buzzer beater from downtown!",
    author: "CourtKing23",
    authorType: "Athlete",
    applause: 12500,
    thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
  },
  {
    id: 2,
    sport: "Football",
    title: "Game-winning touchdown catch",
    author: "GridironGuru",
    authorType: "Commentator",
    applause: 8900,
    thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
  },
  {
    id: 3,
    sport: "Soccer",
    title: "Impossible goal from midfield",
    author: "FootyFanatic",
    authorType: "Entertainment",
    applause: 15200,
    thumbnail: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
  },
  {
    id: 4,
    sport: "Baseball",
    title: "Walk-off home run in the 9th!",
    author: "DiamondPro",
    authorType: "Athlete",
    applause: 7300,
    thumbnail: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80",
  },
  {
    id: 5,
    sport: "Media",
    title: "Breaking down the championship game | Sports Talk",
    author: "TheSportsPod",
    authorType: "Media",
    applause: 9800,
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
  },
  {
    id: 6,
    sport: "Media",
    title: "Weekly NFL Power Rankings Podcast",
    author: "GridironTalk",
    authorType: "Media",
    applause: 6500,
    thumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
  },
  {
    id: 7,
    sport: "Fitness",
    title: "30-min HIIT workout for athletes",
    author: "FitCoachMike",
    authorType: "Fitness",
    applause: 11400,
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
  },
  {
    id: 8,
    sport: "Fitness",
    title: "Pre-game warm up routine",
    author: "AthletePro",
    authorType: "Fitness",
    applause: 8200,
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  },
];

const VideoFeed = () => {
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [applausedVideos, setApplausedVideos] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("none");

  const handleApplause = (videoId: number) => {
    if (applausedVideos.includes(videoId)) {
      setApplausedVideos(applausedVideos.filter(id => id !== videoId));
    } else {
      setApplausedVideos([...applausedVideos, videoId]);
    }
  };

  const filteredVideos = selectedSport === "All Sports" 
    ? MOCK_VIDEOS 
    : MOCK_VIDEOS.filter(v => v.sport === selectedSport);

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto">
      <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Trending Highlights</h2>
          
          <FilterSelector 
            selectedFilter={activeFilter}
            onFilterSelect={setActiveFilter}
          />
          
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {SPORTS_CATEGORIES.map((sport) => (
              <Button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                variant={selectedSport === sport ? "default" : "outline"}
                className={selectedSport === sport ? "bg-primary text-primary-foreground" : ""}
              >
                {sport}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-glow"
            >
              <div className="relative aspect-[9/16] overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <AnimatedFilter type={activeFilter} />
                <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground z-10">
                  {video.sport}
                </Badge>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    {video.author}
                    <Badge variant="outline" className="ml-1 text-xs">
                      {video.authorType}
                    </Badge>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleApplause(video.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      applausedVideos.includes(video.id)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        applausedVideos.includes(video.id) ? "fill-primary" : ""
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {video.applause + (applausedVideos.includes(video.id) ? 1 : 0)}
                    </span>
                  </button>

                  <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm">Reply</span>
                  </button>

                  <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ml-auto">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoFeed;
