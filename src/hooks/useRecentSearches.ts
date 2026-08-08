import { useCallback, useEffect, useState } from "react";

export interface RecentSearch {
  type: "athlete" | "sport";
  id: string;
  label: string;
  sublabel?: string;
  avatar_url?: string | null;
  sportId?: string | null;
  at: number;
}

const KEY = "recent_athlete_searches";
const MAX = 8;
const EVENT = "recent-searches-changed";

function read(): RecentSearch[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? (raw as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

function write(items: RecentSearch[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Persisted recent athlete searches and sport filters (per browser). */
export function useRecentSearches() {
  const [recents, setRecents] = useState<RecentSearch[]>(() => read());

  useEffect(() => {
    const sync = () => setRecents(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addRecent = useCallback((item: Omit<RecentSearch, "at">) => {
    const next = [
      { ...item, at: Date.now() },
      ...read().filter((r) => !(r.type === item.type && r.id === item.id)),
    ].slice(0, MAX);
    write(next);
  }, []);

  const removeRecent = useCallback((type: RecentSearch["type"], id: string) => {
    write(read().filter((r) => !(r.type === type && r.id === id)));
  }, []);

  const clearRecents = useCallback(() => write([]), []);

  return { recents, addRecent, removeRecent, clearRecents };
}
