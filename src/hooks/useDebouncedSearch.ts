import { useEffect, useRef, useState } from 'react';
export function useDebouncedSearch<T>(query: string, search: (query: string, signal: AbortSignal) => Promise<T[]>, minLength = 1) {
  const latestSearch = useRef(search);
  latestSearch.current = search;
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setResults([]); setError(''); setLoading(false);
    const value = query.trim();
    if (value.length < minLength) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      try { const rows = await latestSearch.current(value, controller.signal); if (alive) setResults(rows); }
      catch { if (alive) { setResults([]); setError('Search could not be loaded. Please try again.'); } }
      finally { if (alive) setLoading(false); }
    }, 300);
    return () => { alive = false; clearTimeout(timer); controller.abort(); };
  }, [query, minLength]);
  return { results, loading, error };
}