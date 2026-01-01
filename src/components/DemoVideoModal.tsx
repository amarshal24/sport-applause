import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";
import { motion } from "framer-motion";

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DemoVideoModal = ({ open, onOpenChange }: DemoVideoModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border">
        <DialogTitle className="sr-only">U⚡️Sportz Demo Video</DialogTitle>
        
        <div className="relative aspect-video bg-background">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-20 bg-background/50 backdrop-blur hover:bg-background/80"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {!isPlaying ? (
            /* Thumbnail with Play Button */
            <div className="relative w-full h-full">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80')"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    Welcome to U⚡️Sportz
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    See how athletes showcase talent, fans discover moments, and recruiters find champions.
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlay}
                    className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-glow mx-auto group"
                  >
                    <Play className="h-10 w-10 text-primary-foreground ml-1 group-hover:scale-110 transition-transform" />
                  </motion.button>
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    2 minute walkthrough
                  </p>
                </motion.div>
              </div>
            </div>
          ) : (
            /* Video Player */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full"
            >
              <video
                className="w-full h-full object-cover"
                controls
                autoPlay
                playsInline
                poster="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80"
              >
                {/* Placeholder video - replace with actual demo video URL */}
                <source 
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          )}

          {/* Feature Highlights Bar */}
          {!isPlaying && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur border-t border-border"
            >
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {[
                  "Video Feed",
                  "Recruiting Tools",
                  "Mini Games",
                  "Stories",
                  "Live Streams",
                ].map((feature, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-muted rounded-full text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoVideoModal;
