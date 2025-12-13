import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote, RefreshCw, Heart, Share2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface QuoteData {
  quote: string;
  author: string;
  category: string;
}

const motivationalQuotes: QuoteData[] = [
  {
    quote: "Hard work beats talent when talent doesn't work hard.",
    author: "Tim Notke",
    category: "Work Ethic"
  },
  {
    quote: "Champions keep playing until they get it right.",
    author: "Billie Jean King",
    category: "Perseverance"
  },
  {
    quote: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
    category: "Courage"
  },
  {
    quote: "It's not whether you get knocked down, it's whether you get up.",
    author: "Vince Lombardi",
    category: "Resilience"
  },
  {
    quote: "The only way to prove you are a good sport is to lose.",
    author: "Ernie Banks",
    category: "Sportsmanship"
  },
  {
    quote: "Winners never quit and quitters never win.",
    author: "Vince Lombardi",
    category: "Determination"
  },
  {
    quote: "The more difficult the victory, the greater the happiness in winning.",
    author: "Pelé",
    category: "Victory"
  },
  {
    quote: "I've failed over and over again in my life. And that is why I succeed.",
    author: "Michael Jordan",
    category: "Success"
  },
  {
    quote: "Pain is temporary. Quitting lasts forever.",
    author: "Lance Armstrong",
    category: "Endurance"
  },
  {
    quote: "The difference between the impossible and the possible lies in determination.",
    author: "Tommy Lasorda",
    category: "Determination"
  },
  {
    quote: "Don't count the days; make the days count.",
    author: "Muhammad Ali",
    category: "Motivation"
  },
  {
    quote: "Set your goals high, and don't stop till you get there.",
    author: "Bo Jackson",
    category: "Goals"
  },
  {
    quote: "You can't put a limit on anything. The more you dream, the farther you get.",
    author: "Michael Phelps",
    category: "Dreams"
  },
  {
    quote: "It's not the size of the dog in the fight, it's the size of the fight in the dog.",
    author: "Mark Twain",
    category: "Spirit"
  },
  {
    quote: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    category: "Starting"
  },
];

const MotivationQuotes = () => {
  const [dailyQuote, setDailyQuote] = useState<QuoteData | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // Get quote of the day based on current date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % motivationalQuotes.length;
    setDailyQuote(motivationalQuotes[quoteIndex]);
  }, []);

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setDailyQuote(motivationalQuotes[randomIndex]);
    setLiked(false);
    toast.success("New inspiration loaded!");
  };

  const handleLike = () => {
    setLiked(!liked);
    toast.success(liked ? "Removed from favorites" : "Added to favorites!");
  };

  const handleShare = () => {
    if (dailyQuote) {
      navigator.clipboard.writeText(`"${dailyQuote.quote}" - ${dailyQuote.author}`);
      toast.success("Quote copied to clipboard!");
    }
  };

  if (!dailyQuote) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
          <div className="px-4 lg:px-6 py-6">
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
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6">
          {/* Header */}
          <div className="mb-8 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-3">
              <Quote className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-display font-bold gradient-text">
                Daily Motivation
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Fuel your day with inspiration from legendary athletes
            </p>
          </div>

          {/* Quote of the Day Card */}
          <Card className="glass-effect shadow-glow mb-6 animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-display">
                  <Calendar className="w-5 h-5 text-primary" />
                  Quote of the Day
                </CardTitle>
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {dailyQuote.category}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quote */}
              <div className="relative py-8">
                <Quote className="absolute top-0 left-0 w-12 h-12 text-primary/20" />
                <blockquote className="text-2xl md:text-3xl font-medium text-foreground text-center px-4 md:px-12 leading-relaxed">
                  {dailyQuote.quote}
                </blockquote>
                <Quote className="absolute bottom-0 right-0 w-12 h-12 text-primary/20 rotate-180" />
              </div>

              {/* Author */}
              <div className="text-center">
                <p className="text-lg font-semibold text-muted-foreground">
                  — {dailyQuote.author}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  className={liked ? "border-primary text-primary" : ""}
                >
                  <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />
                  {liked ? "Loved" : "Love It"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getRandomQuote}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Quote
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* All Quotes Grid */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold mb-4">All Quotes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {motivationalQuotes.map((quote, index) => (
                <Card 
                  key={index}
                  className="glass-effect hover:shadow-glow transition-all duration-300 cursor-pointer hover-lift"
                  onClick={() => {
                    setDailyQuote(quote);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Quote className="w-6 h-6 text-primary/40 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {quote.quote}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          — {quote.author}
                        </p>
                      </div>
                    </div>
                    <span className="inline-block text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                      {quote.category}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MotivationQuotes;
