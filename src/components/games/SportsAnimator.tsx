import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, RotateCcw, Play, Pause, Download, Share2, Image, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  onBack: () => void;
}

interface Character {
  sport: string;
  emoji: string;
  color: string;
  equipment: string;
}

interface SavedCreation {
  id: string;
  image_url: string;
  character_sport: string;
  animation_type: string;
  background_type: string;
  created_at: string;
}

const characters: Character[] = [
  { sport: "Basketball", emoji: "🏀", color: "from-orange-400 to-orange-600", equipment: "🎽" },
  { sport: "Soccer", emoji: "⚽", color: "from-green-400 to-green-600", equipment: "👟" },
  { sport: "Baseball", emoji: "⚾", color: "from-red-400 to-red-600", equipment: "🧢" },
  { sport: "Tennis", emoji: "🎾", color: "from-yellow-400 to-lime-500", equipment: "🎾" },
  { sport: "Swimming", emoji: "🏊", color: "from-blue-400 to-cyan-500", equipment: "🥽" },
  { sport: "Football", emoji: "🏈", color: "from-amber-600 to-yellow-500", equipment: "🏈" },
];

const animations = [
  { id: "bounce", name: "Bounce", icon: "⬆️" },
  { id: "spin", name: "Spin", icon: "🔄" },
  { id: "wiggle", name: "Wiggle", icon: "〰️" },
  { id: "pulse", name: "Pulse", icon: "💓" },
  { id: "flip", name: "Flip", icon: "🔃" },
  { id: "wave", name: "Wave", icon: "👋" },
];

const backgrounds = [
  { id: "stadium", name: "Stadium", emoji: "🏟️", gradient: "from-emerald-500 to-emerald-700" },
  { id: "beach", name: "Beach", emoji: "🏖️", gradient: "from-amber-300 to-blue-400" },
  { id: "snow", name: "Snow", emoji: "❄️", gradient: "from-blue-100 to-blue-300" },
  { id: "sunset", name: "Sunset", emoji: "🌅", gradient: "from-orange-400 to-pink-500" },
  { id: "night", name: "Night", emoji: "🌙", gradient: "from-indigo-900 to-purple-800" },
  { id: "rainbow", name: "Rainbow", emoji: "🌈", gradient: "from-red-400 via-yellow-400 to-blue-400" },
];

const expressions = [
  { id: "happy", name: "Happy", emoji: "😊" },
  { id: "excited", name: "Excited", emoji: "🤩" },
  { id: "cool", name: "Cool", emoji: "😎" },
  { id: "determined", name: "Determined", emoji: "😤" },
  { id: "celebrating", name: "Celebrating", emoji: "🥳" },
  { id: "focused", name: "Focused", emoji: "🧐" },
];

const accessories = [
  { id: "none", name: "None", emoji: "❌" },
  { id: "crown", name: "Crown", emoji: "👑" },
  { id: "medal", name: "Medal", emoji: "🏅" },
  { id: "trophy", name: "Trophy", emoji: "🏆" },
  { id: "star", name: "Star", emoji: "⭐" },
  { id: "fire", name: "Fire", emoji: "🔥" },
  { id: "lightning", name: "Lightning", emoji: "⚡" },
  { id: "rainbow", name: "Rainbow", emoji: "🌈" },
];

const sizes = [
  { id: "small", name: "Small", scale: 0.6 },
  { id: "medium", name: "Medium", scale: 1 },
  { id: "large", name: "Large", scale: 1.4 },
];

const getAnimationVariants = (animationId: string) => {
  switch (animationId) {
    case "bounce":
      return {
        y: [0, -40, 0],
        transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const }
      };
    case "spin":
      return {
        rotate: [0, 360],
        transition: { duration: 1, repeat: Infinity, ease: "linear" as const }
      };
    case "wiggle":
      return {
        rotate: [-10, 10, -10],
        transition: { duration: 0.3, repeat: Infinity, ease: "easeInOut" as const }
      };
    case "pulse":
      return {
        scale: [1, 1.3, 1],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" as const }
      };
    case "flip":
      return {
        rotateY: [0, 180, 360],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" as const }
      };
    case "wave":
      return {
        x: [-20, 20, -20],
        y: [-10, 10, -10],
        transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const }
      };
    default:
      return {};
  }
};

const SportsAnimator = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(characters[0]);
  const [selectedAnimation, setSelectedAnimation] = useState<string>("bounce");
  const [selectedBackground, setSelectedBackground] = useState(backgrounds[0]);
  const [selectedExpression, setSelectedExpression] = useState(expressions[0]);
  const [selectedAccessory, setSelectedAccessory] = useState(accessories[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[1]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCreations, setSavedCreations] = useState<SavedCreation[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchSavedCreations = async () => {
    if (!user) return;
    
    setIsLoadingGallery(true);
    try {
      const { data, error } = await supabase
        .from('animator_creations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSavedCreations(data || []);
    } catch (error) {
      console.error("Error fetching creations:", error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (galleryOpen && user) {
      fetchSavedCreations();
    }
  }, [galleryOpen, user]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  const handleReset = () => {
    setSelectedCharacter(characters[0]);
    setSelectedAnimation("bounce");
    setSelectedBackground(backgrounds[0]);
    setSelectedExpression(expressions[0]);
    setSelectedAccessory(accessories[0]);
    setSelectedSize(sizes[1]);
    setIsPlaying(true);
  };

  const captureImage = async (): Promise<string | null> => {
    if (!previewRef.current) return null;
    
    const wasPlaying = isPlaying;
    setIsPlaying(false);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      
      if (wasPlaying) setIsPlaying(true);
      
      return dataUrl;
    } catch (error) {
      console.error("Error capturing image:", error);
      if (wasPlaying) setIsPlaying(true);
      return null;
    }
  };

  const handleSaveImage = async () => {
    setIsSaving(true);
    try {
      const dataUrl = await captureImage();
      if (!dataUrl) {
        toast.error("Failed to capture image");
        return;
      }
      
      const link = document.createElement("a");
      link.download = `sports-animator-${selectedCharacter.sport.toLowerCase()}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Image saved! 🎨");
    } catch (error) {
      toast.error("Failed to save image");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!user) {
      toast.error("Please sign in to save to gallery");
      return;
    }

    setIsSaving(true);
    try {
      const dataUrl = await captureImage();
      if (!dataUrl) {
        toast.error("Failed to capture image");
        return;
      }

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-${selectedCharacter.sport.toLowerCase()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('animator-creations')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('animator-creations')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('animator_creations')
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          character_sport: selectedCharacter.sport,
          animation_type: selectedAnimation,
          background_type: selectedBackground.id,
        });

      if (dbError) throw dbError;

      toast.success("Saved to gallery! 🎨");
      fetchSavedCreations();
    } catch (error) {
      console.error("Error saving to gallery:", error);
      toast.error("Failed to save to gallery");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCreation = async (creation: SavedCreation) => {
    if (!user) return;

    try {
      // Extract file path from URL
      const urlParts = creation.image_url.split('/animator-creations/');
      const filePath = urlParts[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage
          .from('animator-creations')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('animator_creations')
        .delete()
        .eq('id', creation.id);

      if (error) throw error;

      setSavedCreations(prev => prev.filter(c => c.id !== creation.id));
      toast.success("Creation deleted!");
    } catch (error) {
      console.error("Error deleting creation:", error);
      toast.error("Failed to delete");
    }
  };

  const handleShare = async () => {
    setIsSaving(true);
    try {
      const dataUrl = await captureImage();
      if (!dataUrl) {
        toast.error("Failed to capture image");
        return;
      }
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `sports-animator-${selectedCharacter.sport.toLowerCase()}.png`, { type: "image/png" });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "My Sports Animation",
          text: `Check out my ${selectedCharacter.sport} animation! 🏆`,
          files: [file],
        });
        toast.success("Shared successfully! 🎉");
      } else if (navigator.share) {
        await navigator.share({
          title: "My Sports Animation",
          text: `Check out my ${selectedCharacter.sport} animation with ${selectedAnimation} effect! 🏆`,
        });
        toast.success("Shared successfully! 🎉");
      } else {
        await navigator.clipboard.writeText(`Check out my ${selectedCharacter.sport} animation! 🏆`);
        toast.success("Link copied to clipboard! 📋");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Failed to share");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-6 hover:bg-primary/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Games
      </Button>

      <Card className="glass-effect overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white">
          <CardTitle className="text-3xl font-display flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8" />
            Sports Animator
            <Sparkles className="w-8 h-8" />
          </CardTitle>
          <p className="text-white/80">Create your own animated sports character!</p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Animation Preview */}
          <div 
            ref={previewRef}
            className={`relative h-64 rounded-2xl bg-gradient-to-br ${selectedBackground.gradient} flex items-center justify-center overflow-hidden shadow-xl`}
          >
            {/* Confetti effect */}
            <AnimatePresence>
              {showConfetti && (
                <>
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-2xl"
                      initial={{ 
                        x: "50%", 
                        y: "50%", 
                        opacity: 1 
                      }}
                      animate={{ 
                        x: `${Math.random() * 100}%`, 
                        y: `${Math.random() * 100}%`,
                        opacity: 0,
                        rotate: Math.random() * 360
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2 }}
                    >
                      {["⭐", "🎉", "✨", "🌟", "💫"][i % 5]}
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Character with expression and accessory */}
            <motion.div
              className="cursor-pointer select-none flex flex-col items-center relative"
              style={{ fontSize: `${6 * selectedSize.scale}rem` }}
              animate={isPlaying ? getAnimationVariants(selectedAnimation) : {}}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlay}
            >
              {/* Accessory above */}
              {selectedAccessory.id !== "none" && (
                <motion.div 
                  className="absolute -top-8"
                  style={{ fontSize: `${2.5 * selectedSize.scale}rem` }}
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: selectedAccessory.id === "fire" || selectedAccessory.id === "lightning" ? [-5, 5, -5] : 0
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {selectedAccessory.emoji}
                </motion.div>
              )}
              
              {/* Main character */}
              <span>{selectedCharacter.emoji}</span>
              
              {/* Expression below */}
              <motion.div 
                className="absolute -bottom-6"
                style={{ fontSize: `${2 * selectedSize.scale}rem` }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {selectedExpression.emoji}
              </motion.div>
            </motion.div>

            {/* Equipment floating around */}
            <motion.div
              className="absolute top-4 right-4 text-4xl"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {selectedCharacter.equipment}
            </motion.div>

            {/* Background emoji */}
            <div className="absolute bottom-4 left-4 text-3xl opacity-50">
              {selectedBackground.emoji}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={handlePlay}
              className={`${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveImage}
              disabled={isSaving}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {user && (
              <Button 
                variant="outline" 
                onClick={handleSaveToGallery}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
              >
                <Image className="w-4 h-4 mr-2" />
                Save to Gallery
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleShare}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 hover:from-blue-600 hover:to-cyan-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            {/* Gallery Button */}
            {user && (
              <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600">
                    <Image className="w-4 h-4 mr-2" />
                    My Gallery
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-primary" />
                      My Creations Gallery
                    </DialogTitle>
                  </DialogHeader>
                  
                  {isLoadingGallery ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : savedCreations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No creations yet!</p>
                      <p className="text-sm">Save your first animation to see it here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {savedCreations.map((creation) => (
                        <motion.div
                          key={creation.id}
                          className="relative group rounded-xl overflow-hidden shadow-lg"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <img 
                            src={creation.image_url} 
                            alt={`${creation.character_sport} animation`}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-white text-sm font-medium">{creation.character_sport}</p>
                              <p className="text-white/70 text-xs">{creation.animation_type} • {creation.background_type}</p>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = creation.image_url;
                                    link.download = `creation-${creation.id}.png`;
                                    link.click();
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleDeleteCreation(creation)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Character Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Your Sport</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {characters.map((char) => (
                <motion.button
                  key={char.sport}
                  onClick={() => setSelectedCharacter(char)}
                  className={`p-4 rounded-xl bg-gradient-to-br ${char.color} text-4xl transition-all ${
                    selectedCharacter.sport === char.sport 
                      ? 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {char.emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Animation Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Animation</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {animations.map((anim) => (
                <motion.button
                  key={anim.id}
                  onClick={() => setSelectedAnimation(anim.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedAnimation === anim.id 
                      ? 'border-primary bg-primary/20 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">{anim.icon}</div>
                  <div className="text-xs font-medium">{anim.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Background Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Background</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {backgrounds.map((bg) => (
                <motion.button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg)}
                  className={`p-3 rounded-xl bg-gradient-to-br ${bg.gradient} transition-all ${
                    selectedBackground.id === bg.id 
                      ? 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">{bg.emoji}</div>
                  <div className="text-xs font-medium text-white drop-shadow-md">{bg.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Expression Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Expression</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {expressions.map((expr) => (
                <motion.button
                  key={expr.id}
                  onClick={() => setSelectedExpression(expr)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedExpression.id === expr.id 
                      ? 'border-primary bg-primary/20 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">{expr.emoji}</div>
                  <div className="text-xs font-medium">{expr.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Accessory Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Accessory</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {accessories.map((acc) => (
                <motion.button
                  key={acc.id}
                  onClick={() => setSelectedAccessory(acc)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedAccessory.id === acc.id 
                      ? 'border-primary bg-primary/20 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">{acc.emoji}</div>
                  <div className="text-xs font-medium">{acc.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Size</h3>
            <div className="flex justify-center gap-4">
              {sizes.map((size) => (
                <motion.button
                  key={size.id}
                  onClick={() => setSelectedSize(size)}
                  className={`px-6 py-3 rounded-xl border-2 transition-all ${
                    selectedSize.id === size.id 
                      ? 'border-primary bg-primary/20 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-sm font-medium">{size.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Fun tip */}
          <div className="text-center p-4 bg-primary/10 rounded-xl">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-medium">Tip:</span> {user ? "Save to your gallery to keep your favorite creations!" : "Sign in to save creations to your personal gallery!"} Mix expressions and accessories for unique characters!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SportsAnimator;