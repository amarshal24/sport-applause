import { useCallback, useRef, useEffect } from "react";

// Audio context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const useGameSounds = () => {
  const bgMusicRef = useRef<OscillatorNode | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);

  // Play a beep/tone with specified frequency and duration
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, []);

  // Score/success sound - ascending notes
  const playScore = useCallback(() => {
    playTone(523, 0.1, "sine", 0.4); // C5
    setTimeout(() => playTone(659, 0.1, "sine", 0.4), 100); // E5
    setTimeout(() => playTone(784, 0.2, "sine", 0.4), 200); // G5
  }, [playTone]);

  // Miss/fail sound - descending
  const playMiss = useCallback(() => {
    playTone(400, 0.15, "sawtooth", 0.2);
    setTimeout(() => playTone(300, 0.2, "sawtooth", 0.2), 100);
  }, [playTone]);

  // Bounce/hit sound
  const playBounce = useCallback(() => {
    playTone(600, 0.08, "triangle", 0.3);
  }, [playTone]);

  // Shoot/throw sound - whoosh
  const playShoot = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, []);

  // Button click sound
  const playClick = useCallback(() => {
    playTone(800, 0.05, "square", 0.15);
  }, [playTone]);

  // Game start fanfare
  const playGameStart = useCallback(() => {
    playTone(392, 0.15, "sine", 0.3); // G4
    setTimeout(() => playTone(523, 0.15, "sine", 0.3), 150); // C5
    setTimeout(() => playTone(659, 0.15, "sine", 0.3), 300); // E5
    setTimeout(() => playTone(784, 0.3, "sine", 0.4), 450); // G5
  }, [playTone]);

  // Game over sound
  const playGameOver = useCallback(() => {
    playTone(392, 0.2, "sine", 0.3);
    setTimeout(() => playTone(349, 0.2, "sine", 0.3), 200);
    setTimeout(() => playTone(330, 0.2, "sine", 0.3), 400);
    setTimeout(() => playTone(262, 0.4, "sine", 0.3), 600);
  }, [playTone]);

  // Countdown tick
  const playTick = useCallback(() => {
    playTone(1000, 0.05, "square", 0.1);
  }, [playTone]);

  // Power up charging sound
  const playPowerUp = useCallback((power: number) => {
    const freq = 200 + power * 6; // 200-800Hz based on power
    playTone(freq, 0.05, "sawtooth", 0.15);
  }, [playTone]);

  // Streak/combo sound
  const playStreak = useCallback((streakCount: number) => {
    const baseFreq = 523 + streakCount * 100;
    playTone(baseFreq, 0.1, "sine", 0.4);
    setTimeout(() => playTone(baseFreq * 1.5, 0.15, "sine", 0.4), 100);
  }, [playTone]);

  // Start background music (simple looping pattern)
  const startBgMusic = useCallback((tempo: "slow" | "medium" | "fast" = "medium") => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      // Stop existing music
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.connect(ctx.destination);
      bgGainRef.current = gainNode;

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        noteGain.gain.setValueAtTime(0.1, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(noteGain);
        noteGain.connect(gainNode);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const interval = tempo === "fast" ? 200 : tempo === "slow" ? 400 : 300;
      const notes = [262, 330, 392, 330]; // C E G E pattern
      let noteIndex = 0;

      const playLoop = () => {
        if (bgGainRef.current) {
          playNote(notes[noteIndex % notes.length], ctx.currentTime, 0.2);
          noteIndex++;
        }
      };

      const intervalId = setInterval(playLoop, interval);
      
      // Store cleanup function
      (bgMusicRef as any).intervalId = intervalId;
    } catch (e) {
      console.warn("Background music failed:", e);
    }
  }, []);

  // Stop background music
  const stopBgMusic = useCallback(() => {
    if ((bgMusicRef as any).intervalId) {
      clearInterval((bgMusicRef as any).intervalId);
    }
    if (bgGainRef.current) {
      bgGainRef.current.gain.setValueAtTime(0, getAudioContext().currentTime);
      bgGainRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBgMusic();
    };
  }, [stopBgMusic]);

  return {
    playScore,
    playMiss,
    playBounce,
    playShoot,
    playClick,
    playGameStart,
    playGameOver,
    playTick,
    playPowerUp,
    playStreak,
    startBgMusic,
    stopBgMusic,
  };
};
