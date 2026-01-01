import { useState } from "react";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MoodReligionSelector from "@/components/MoodReligionSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote, Heart, Share2, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface GeneratedContent {
  contentType: "quote" | "prayer";
  mood: string;
  religion?: string;
  quote?: string;
  reflection?: string;
  prayer?: string;
  blessing?: string;
}

const MotivationQuotes = () => {
  const [liked, setLiked] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const handleContentGenerated = (content: GeneratedContent) => {
    setGeneratedContent(content);
    setLiked(false);
  };

  const handleShareGenerated = () => {
    if (generatedContent) {
      const text = generatedContent.contentType === 'quote'
        ? generatedContent.quote
        : generatedContent.prayer;
      navigator.clipboard.writeText(text || '');
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6">
          {/* Header */}
          <div className="mb-8 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-display font-bold gradient-text">
                Daily Motivation
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Get personalized inspiration based on your mood
            </p>
          </div>

          {/* Mood & Religion Selector */}
          <div className="mb-6">
            <MoodReligionSelector onContentGenerated={handleContentGenerated} />
          </div>

          {/* Generated Content Display */}
          {generatedContent && (
            <Card className="glass-effect shadow-glow mb-6 animate-slide-up border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-display">
                    {generatedContent.contentType === 'quote' ? (
                      <>
                        <Sparkles className="w-5 h-5 text-primary" />
                        Your Personalized Quote
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-5 h-5 text-primary" />
                        Your Prayer
                      </>
                    )}
                  </CardTitle>
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                    {generatedContent.mood}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative py-6">
                  {generatedContent.contentType === 'quote' ? (
                    <>
                      <Quote className="absolute top-0 left-0 w-10 h-10 text-primary/20" />
                      <blockquote className="text-xl md:text-2xl font-medium text-foreground text-center px-4 md:px-10 leading-relaxed">
                        {generatedContent.quote}
                      </blockquote>
                      <Quote className="absolute bottom-0 right-0 w-10 h-10 text-primary/20 rotate-180" />
                      {generatedContent.reflection && (
                        <p className="text-center text-muted-foreground mt-4 italic">
                          {generatedContent.reflection}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <BookOpen className="absolute top-0 left-0 w-10 h-10 text-primary/20" />
                      <p className="text-xl md:text-2xl font-medium text-foreground text-center px-4 md:px-10 leading-relaxed">
                        {generatedContent.prayer}
                      </p>
                      <BookOpen className="absolute bottom-0 right-0 w-10 h-10 text-primary/20" />
                      {generatedContent.blessing && (
                        <p className="text-center text-primary font-semibold mt-4">
                          {generatedContent.blessing}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLiked(!liked)}
                    className={liked ? "border-primary text-primary" : ""}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />
                    {liked ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareGenerated}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default MotivationQuotes;
