import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const POSITIVE_EMOJIS = ["❤️", "🔥", "👏", "💪", "🙌", "⚡"];

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

interface StoryReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoryViewer = ({ stories, initialIndex, open, onOpenChange }: StoryViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [reactions, setReactions] = useState<Record<string, StoryReaction[]>>({});
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!open || !currentStory) return;
    fetchReactions(currentStory.id);
  }, [open, currentStory?.id]);

  const fetchReactions = async (storyId: string) => {
    const { data } = await supabase
      .from("story_reactions")
      .select("emoji, user_id")
      .eq("story_id", storyId);

    if (data) {
      const emojiCounts: Record<string, { count: number; hasReacted: boolean }> = {};
      
      data.forEach((reaction) => {
        if (!emojiCounts[reaction.emoji]) {
          emojiCounts[reaction.emoji] = { count: 0, hasReacted: false };
        }
        emojiCounts[reaction.emoji].count++;
        if (reaction.user_id === user?.id) {
          emojiCounts[reaction.emoji].hasReacted = true;
        }
      });

      const reactionList: StoryReaction[] = Object.entries(emojiCounts).map(
        ([emoji, { count, hasReacted }]) => ({ emoji, count, hasReacted })
      );

      setReactions((prev) => ({ ...prev, [storyId]: reactionList }));
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user || !currentStory) {
      toast({
        title: "Sign in required",
        description: "Please sign in to react to stories",
        variant: "destructive",
      });
      return;
    }

    // Show floating emoji animation
    setFloatingEmoji(emoji);
    setTimeout(() => setFloatingEmoji(null), 1000);

    const storyReactions = reactions[currentStory.id] || [];
    const existingReaction = storyReactions.find((r) => r.hasReacted);

    try {
      if (existingReaction) {
        // Update existing reaction
        await supabase
          .from("story_reactions")
          .update({ emoji })
          .eq("story_id", currentStory.id)
          .eq("user_id", user.id);
      } else {
        // Insert new reaction
        await supabase.from("story_reactions").insert({
          story_id: currentStory.id,
          user_id: user.id,
          emoji,
        });
      }

      fetchReactions(currentStory.id);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }

    const duration = 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onOpenChange(false);
            return 0;
          }
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [open, currentIndex, stories.length, onOpenChange]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  };

  if (!currentStory) return null;

  const currentReactions = reactions[currentStory.id] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full h-[90vh] p-0 bg-black border-none overflow-hidden">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{
                  width:
                    index < currentIndex
                      ? "100%"
                      : index === currentIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage
                src={currentStory.profiles.avatar_url || undefined}
                alt={currentStory.profiles.username}
              />
              <AvatarFallback>{currentStory.profiles.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">
                {currentStory.profiles.username}
              </p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Story Image */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          <img
            src={currentStory.image_url}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Floating Emoji Animation */}
        <AnimatePresence>
          {floatingEmoji && (
            <motion.div
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 0, scale: 2, y: -100 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 text-6xl pointer-events-none"
            >
              {floatingEmoji}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction counts display */}
        {currentReactions.length > 0 && (
          <div className="absolute bottom-24 left-4 z-20 flex gap-2 flex-wrap">
            {currentReactions.map((reaction) => (
              <div
                key={reaction.emoji}
                className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1"
              >
                <span className="text-lg">{reaction.emoji}</span>
                <span className="text-white text-sm font-medium">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reaction buttons */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2 px-4">
          {POSITIVE_EMOJIS.map((emoji) => {
            const hasReacted = currentReactions.some(
              (r) => r.emoji === emoji && r.hasReacted
            );
            return (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                className={`text-2xl hover:bg-white/20 hover:scale-125 transition-all ${
                  hasReacted ? "bg-white/30 ring-2 ring-white" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction(emoji);
                }}
              >
                {emoji}
              </Button>
            );
          })}
        </div>

        {/* Navigation areas */}
        <div
          className="absolute left-0 top-0 bottom-24 w-1/3 cursor-pointer z-10"
          onClick={goToPrevious}
        />
        <div
          className="absolute right-0 top-0 bottom-24 w-1/3 cursor-pointer z-10"
          onClick={goToNext}
        />

        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 opacity-0 hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        {currentIndex < stories.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 opacity-0 hover:opacity-100 transition-opacity"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryViewer;