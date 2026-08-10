import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TrackPoint } from "@/lib/objectTracker";

export interface SavedTrack {
  id: string;
  label: string;
  clipKey: string;
  clipDuration: number | null;
  path: TrackPoint[];
  avgConfidence: number | null;
  worstConfidence: number | null;
  health: string | null;
  createdAt: string;
}

const LOCAL_KEY = "usportz.savedTracks.v1";

/** Stable identity for a clip so a saved path can be matched back to it later. */
export const clipKeyOf = (source?: File | Blob | string | null): string | null => {
  if (!source) return null;
  if (typeof source === "string") {
    if (source.startsWith("blob:") || source.startsWith("data:")) return null;
    return source.split("?")[0];
  }
  if (source instanceof File) {
    return `file:${source.name}:${source.size}:${source.lastModified}`;
  }
  return `blob:${source.size}:${source.type}`;
};

const readLocal = (): SavedTrack[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as SavedTrack[]) : [];
  } catch {
    return [];
  }
};

const writeLocal = (rows: SavedTrack[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 50)));
  } catch {
    /* quota — ignore */
  }
};

type Row = {
  id: string;
  label: string;
  clip_key: string;
  clip_duration: number | null;
  path: unknown;
  avg_confidence: number | null;
  worst_confidence: number | null;
  health: string | null;
  created_at: string;
};

const fromRow = (r: Row): SavedTrack => ({
  id: r.id,
  label: r.label,
  clipKey: r.clip_key,
  clipDuration: r.clip_duration,
  path: (r.path as TrackPoint[]) ?? [],
  avgConfidence: r.avg_confidence,
  worstConfidence: r.worst_confidence,
  health: r.health,
  createdAt: r.created_at,
});

/**
 * Saved tracking data (object path + confidence scores) so the same lock can be
 * reused across re-edits or re-rendered with a different animation filter.
 * Signed-in users sync to the backend; guests fall back to local storage.
 */
export const useSavedTracks = () => {
  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setTracks(readLocal());
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("fx_tracks")
      .select("id,label,clip_key,clip_duration,path,avg_confidence,worst_confidence,health,created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) {
      console.error("Failed to load saved tracks", error);
      setTracks(readLocal());
    } else {
      setTracks(((data ?? []) as Row[]).map(fromRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTrack = useCallback(
    async (input: {
      label: string;
      clipKey: string;
      clipDuration?: number | null;
      path: TrackPoint[];
      avgConfidence?: number | null;
      worstConfidence?: number | null;
      health?: string | null;
    }): Promise<SavedTrack | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        const local: SavedTrack = {
          id: crypto.randomUUID(),
          label: input.label,
          clipKey: input.clipKey,
          clipDuration: input.clipDuration ?? null,
          path: input.path,
          avgConfidence: input.avgConfidence ?? null,
          worstConfidence: input.worstConfidence ?? null,
          health: input.health ?? null,
          createdAt: new Date().toISOString(),
        };
        const next = [local, ...readLocal()];
        writeLocal(next);
        setTracks(next);
        return local;
      }
      const { data, error } = await supabase
        .from("fx_tracks")
        .insert({
          user_id: auth.user.id,
          label: input.label,
          clip_key: input.clipKey,
          clip_duration: input.clipDuration ?? null,
          path: input.path as unknown as never,
          avg_confidence: input.avgConfidence ?? null,
          worst_confidence: input.worstConfidence ?? null,
          health: input.health ?? null,
        })
        .select("id,label,clip_key,clip_duration,path,avg_confidence,worst_confidence,health,created_at")
        .single();
      if (error || !data) {
        console.error("Failed to save track", error);
        return null;
      }
      const saved = fromRow(data as Row);
      setTracks((t) => [saved, ...t]);
      return saved;
    },
    []
  );

  const deleteTrack = useCallback(async (id: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      const next = readLocal().filter((t) => t.id !== id);
      writeLocal(next);
      setTracks(next);
      return;
    }
    const { error } = await supabase.from("fx_tracks").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete track", error);
      return;
    }
    setTracks((t) => t.filter((x) => x.id !== id));
  }, []);

  const renameTrack = useCallback(async (id: string, label: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      const next = readLocal().map((t) => (t.id === id ? { ...t, label } : t));
      writeLocal(next);
      setTracks(next);
      return;
    }
    const { error } = await supabase.from("fx_tracks").update({ label }).eq("id", id);
    if (error) {
      console.error("Failed to rename track", error);
      return;
    }
    setTracks((t) => t.map((x) => (x.id === id ? { ...x, label } : x)));
  }, []);

  return { tracks, loading, reload: load, saveTrack, deleteTrack, renameTrack };
};
