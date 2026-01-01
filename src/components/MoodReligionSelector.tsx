import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Mood {
  id: string;
  emoji: string;
  label: string;
}

interface Religion {
  id: string;
  label: string;
  icon: string;
}

const moods: Mood[] = [
  { id: "anxious", emoji: "😰", label: "Anxious" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "grateful", emoji: "🙏", label: "Grateful" },
  { id: "hopeful", emoji: "🌟", label: "Hopeful" },
  { id: "tired", emoji: "😴", label: "Tired" },
  { id: "motivated", emoji: "💪", label: "Motivated" },
  { id: "peaceful", emoji: "😌", label: "Peaceful" },
  { id: "stressed", emoji: "😫", label: "Stressed" },
];

const religions: Religion[] = [
  { id: "christianity", label: "Christianity", icon: "✝️" },
  { id: "islam", label: "Islam", icon: "☪️" },
  { id: "judaism", label: "Judaism", icon: "✡️" },
  { id: "hinduism", label: "Hinduism", icon: "🕉️" },
  { id: "buddhism", label: "Buddhism", icon: "☸️" },
  { id: "spiritual", label: "Spiritual", icon: "🌿" },
];

interface GeneratedContent {
  contentType: "quote" | "prayer";
  mood: string;
  religion?: string;
  quote?: string;
  reflection?: string;
  prayer?: string;
  blessing?: string;
}

interface MoodReligionSelectorProps {
  onContentGenerated: (content: GeneratedContent) => void;
}

const MoodReligionSelector = ({ onContentGenerated }: MoodReligionSelectorProps) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedReligion, setSelectedReligion] = useState<string | null>(null);
  const [contentType, setContentType] = useState<"quote" | "prayer">("quote");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedMood) {
      toast.error("Please select your mood first");
      return;
    }

    if (contentType === "prayer" && !selectedReligion) {
      toast.error("Please select a religion for prayers");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-motivation', {
        body: {
          mood: selectedMood,
          contentType,
          religion: selectedReligion,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      onContentGenerated(data as GeneratedContent);
      toast.success(`${contentType === 'quote' ? 'Quote' : 'Prayer'} generated!`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="glass-effect shadow-glow animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Sparkles className="w-5 h-5 text-primary" />
          Personalized Inspiration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Type Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">What would you like?</label>
          <div className="flex gap-2">
            <Button
              variant={contentType === "quote" ? "default" : "outline"}
              size="sm"
              onClick={() => setContentType("quote")}
              className="flex-1"
            >
              <Heart className="mr-2 h-4 w-4" />
              Motivational Quote
            </Button>
            <Button
              variant={contentType === "prayer" ? "default" : "outline"}
              size="sm"
              onClick={() => setContentType("prayer")}
              className="flex-1"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Prayer
            </Button>
          </div>
        </div>

        {/* Mood Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">How are you feeling?</label>
          <div className="grid grid-cols-4 gap-2">
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 hover:scale-105 ${
                  selectedMood === mood.id
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-xs font-medium">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Religion Selection (only for prayers) */}
        {contentType === "prayer" && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-sm font-medium text-muted-foreground">Select your faith tradition</label>
            <div className="grid grid-cols-3 gap-2">
              {religions.map((religion) => (
                <button
                  key={religion.id}
                  onClick={() => setSelectedReligion(religion.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 hover:scale-105 ${
                    selectedReligion === religion.id
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{religion.icon}</span>
                  <span className="text-xs font-medium">{religion.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedMood || (contentType === "prayer" && !selectedReligion)}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate {contentType === "quote" ? "Quote" : "Prayer"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MoodReligionSelector;
