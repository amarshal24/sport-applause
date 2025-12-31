import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Scissors, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicTrimmerProps {
  audioUrl: string;
  onTrimComplete: (startTime: number, endTime: number, fadeIn: number, fadeOut: number) => void;
  onCancel: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const MusicTrimmer = ({ audioUrl, onTrimComplete, onCancel }: MusicTrimmerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const animationRef = useRef<number>();
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setTrimEnd(Math.min(audio.duration, 30)); // Default max 30 seconds
      setIsLoaded(true);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(trimStart);
    });

    return () => {
      audio.pause();
      audio.src = "";
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl]);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Loop within trim range
      if (time >= trimEnd) {
        audioRef.current.currentTime = trimStart;
        setCurrentTime(trimStart);
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [isPlaying, trimStart, trimEnd]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updateProgress]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = trimStart;
      
      // Set up Web Audio API for fade preview
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        gainNodeRef.current = audioContextRef.current.createGain();
        source.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
      
      // Apply fade in
      if (gainNodeRef.current && fadeIn > 0) {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
        gainNodeRef.current.gain.linearRampToValueAtTime(1, audioContextRef.current!.currentTime + fadeIn);
      } else if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(1, audioContextRef.current!.currentTime);
      }
      
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle fade out during playback
  useEffect(() => {
    if (isPlaying && gainNodeRef.current && audioContextRef.current && fadeOut > 0) {
      const checkFadeOut = () => {
        if (audioRef.current && gainNodeRef.current && audioContextRef.current) {
          const timeUntilEnd = trimEnd - audioRef.current.currentTime;
          if (timeUntilEnd <= fadeOut && timeUntilEnd > 0) {
            const fadeProgress = timeUntilEnd / fadeOut;
            gainNodeRef.current.gain.setValueAtTime(fadeProgress, audioContextRef.current.currentTime);
          }
        }
        if (isPlaying) {
          requestAnimationFrame(checkFadeOut);
        }
      };
      checkFadeOut();
    }
  }, [isPlaying, fadeOut, trimEnd]);

  const handleTrimChange = (values: number[]) => {
    const [start, end] = values;
    setTrimStart(start);
    setTrimEnd(end);
    
    if (audioRef.current && isPlaying) {
      if (audioRef.current.currentTime < start || audioRef.current.currentTime > end) {
        audioRef.current.currentTime = start;
        setCurrentTime(start);
      }
    }
  };

  const handleConfirm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onTrimComplete(trimStart, trimEnd, fadeIn, fadeOut);
  };

  const maxFadeDuration = Math.min((trimEnd - trimStart) / 2, 5);

  // Generate waveform bars (visual representation)
  const waveformBars = Array.from({ length: 50 }, (_, i) => ({
    height: 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20,
    position: (i / 50) * 100,
  }));

  const trimDuration = trimEnd - trimStart;

  if (!isLoaded) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Scissors className="h-4 w-4" />
        <span>Trim your music (max 30 seconds recommended)</span>
      </div>

      {/* Waveform Visualization */}
      <div className="relative h-20 bg-muted/50 rounded-lg overflow-hidden">
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center justify-around px-1">
          {waveformBars.map((bar, i) => {
            const position = (i / waveformBars.length) * duration;
            const isInRange = position >= trimStart && position <= trimEnd;
            const isCurrentPosition = Math.abs(position - currentTime) < (duration / waveformBars.length);
            
            return (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-100",
                  isCurrentPosition && isPlaying
                    ? "bg-primary scale-110"
                    : isInRange
                      ? "bg-primary/70"
                      : "bg-muted-foreground/30"
                )}
                style={{ height: `${bar.height}%` }}
              />
            );
          })}
        </div>

        {/* Trim overlay - left side (before trim start) */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-background/70"
          style={{ width: `${(trimStart / duration) * 100}%` }}
        />
        
        {/* Trim overlay - right side (after trim end) */}
        <div 
          className="absolute top-0 bottom-0 right-0 bg-background/70"
          style={{ width: `${((duration - trimEnd) / duration) * 100}%` }}
        />

        {/* Current position indicator */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      {/* Range Slider */}
      <div className="px-2">
        <Slider
          value={[trimStart, trimEnd]}
          min={0}
          max={duration}
          step={0.1}
          onValueChange={handleTrimChange}
          className="cursor-pointer"
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Start:</span>
          <span className="font-mono font-medium">{formatTime(trimStart)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Duration:</span>
          <span className={cn(
            "font-mono font-medium",
            trimDuration > 30 && "text-yellow-500"
          )}>
            {formatTime(trimDuration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">End:</span>
          <span className="font-mono font-medium">{formatTime(trimEnd)}</span>
        </div>
      </div>

      {/* Fade Controls */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Fade Effects</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fade In</span>
              <span className="font-mono font-medium">{fadeIn.toFixed(1)}s</span>
            </div>
            <Slider
              value={[fadeIn]}
              min={0}
              max={maxFadeDuration}
              step={0.1}
              onValueChange={([value]) => setFadeIn(value)}
              className="cursor-pointer"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fade Out</span>
              <span className="font-mono font-medium">{fadeOut.toFixed(1)}s</span>
            </div>
            <Slider
              value={[fadeOut]}
              min={0}
              max={maxFadeDuration}
              step={0.1}
              onValueChange={([value]) => setFadeOut(value)}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlay}
          className="gap-2"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Preview
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} className="gap-2">
            <Check className="h-4 w-4" />
            Apply Trim
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MusicTrimmer;
