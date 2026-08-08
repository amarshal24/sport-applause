export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  mood: string;
  url: string;
  isCustom?: boolean;
  trimStart?: number;
  trimEnd?: number;
  fadeIn?: number;
  fadeOut?: number;
}

// Royalty-free music library
export const musicLibrary: MusicTrack[] = [
  { id: "1", title: "Victory Anthem", artist: "Sports Beats", duration: "2:45", mood: "energetic", url: "https://cdn.pixabay.com/audio/2024/11/01/audio_06bc1f4e85.mp3" },
  { id: "2", title: "Champion's Rise", artist: "Athletic Sounds", duration: "3:12", mood: "motivated", url: "https://cdn.pixabay.com/audio/2024/09/14/audio_2e31a36ffb.mp3" },
  { id: "3", title: "Warm Up Flow", artist: "Gym Vibes", duration: "2:30", mood: "chill", url: "https://cdn.pixabay.com/audio/2024/08/08/audio_c51be6afe9.mp3" },
  { id: "4", title: "Focus Mode", artist: "Zen Athletics", duration: "3:00", mood: "focused", url: "https://cdn.pixabay.com/audio/2024/05/16/audio_166af04339.mp3" },
  { id: "5", title: "Game Day Energy", artist: "Sports Beats", duration: "2:55", mood: "pumped", url: "https://cdn.pixabay.com/audio/2024/11/04/audio_e4c0ce3e27.mp3" },
  { id: "6", title: "Winning Moment", artist: "Victory Lane", duration: "2:20", mood: "victorious", url: "https://cdn.pixabay.com/audio/2024/10/22/audio_c9e6b2bf6f.mp3" },
  { id: "7", title: "Training Montage", artist: "Workout Mix", duration: "3:30", mood: "energetic", url: "https://cdn.pixabay.com/audio/2024/09/22/audio_e67bcb74e9.mp3" },
  { id: "8", title: "Cool Down", artist: "Relaxed Beats", duration: "2:40", mood: "chill", url: "https://cdn.pixabay.com/audio/2024/07/30/audio_9ade1be24e.mp3" },
];

const MOOD_KEYWORDS: Record<string, string[]> = {
  pumped: ["trap", "hype", "rap", "drill", "aggressive", "pumped", "hard"],
  energetic: ["edm", "dance", "electronic", "pop", "fast", "energetic", "upbeat", "house"],
  motivated: ["rock", "anthem", "motivat", "inspir", "epic", "orchestral", "determin"],
  victorious: ["victory", "triumph", "win", "celebrat", "champion"],
  focused: ["focus", "instrumental", "lo-fi", "lofi", "ambient", "concentrat", "minimal"],
  chill: ["chill", "calm", "relax", "soul", "r&b", "acoustic", "slow", "cool"],
};

/**
 * Map an AI music recommendation (which has no playable audio) to the closest
 * playable royalty-free library track so it can be applied to a clip.
 */
export function matchTrackToRecommendation(rec: {
  genre?: string;
  description?: string;
  title?: string;
}, mood?: string): MusicTrack {
  const haystack = `${rec.genre ?? ""} ${rec.description ?? ""} ${rec.title ?? ""}`.toLowerCase();

  let bestMood = mood && musicLibrary.some((t) => t.mood === mood) ? mood : "";
  let bestScore = bestMood ? 1 : 0;

  for (const [m, words] of Object.entries(MOOD_KEYWORDS)) {
    const score = words.reduce((acc, w) => acc + (haystack.includes(w) ? 2 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMood = m;
    }
  }

  const pool = musicLibrary.filter((t) => t.mood === bestMood);
  return (pool.length ? pool : musicLibrary)[0];
}
