import { useCallback, useEffect, useRef, useState } from "react";

interface Entry<P> {
  id: string;
  prev: P;
  next: P;
}

/**
 * Undo/redo for per-pin style edits (skin / animation) before they're locked in.
 * Each recorded change stores the patch that was applied and the values it replaced.
 */
export function useStyleHistory<P extends Record<string, unknown>>(
  apply: (id: string, patch: P) => void
) {
  const past = useRef<Entry<P>[]>([]);
  const future = useRef<Entry<P>[]>([]);
  const [, bump] = useState(0);
  const sync = () => bump((n) => n + 1);

  const record = useCallback((id: string, prev: P, next: P) => {
    past.current = [...past.current, { id, prev, next }].slice(-50);
    future.current = [];
    sync();
  }, []);

  const undo = useCallback(() => {
    const entry = past.current[past.current.length - 1];
    if (!entry) return false;
    past.current = past.current.slice(0, -1);
    future.current = [...future.current, entry];
    apply(entry.id, entry.prev);
    sync();
    return true;
  }, [apply]);

  const redo = useCallback(() => {
    const entry = future.current[future.current.length - 1];
    if (!entry) return false;
    future.current = future.current.slice(0, -1);
    past.current = [...past.current, entry];
    apply(entry.id, entry.next);
    sync();
    return true;
  }, [apply]);

  const reset = useCallback(() => {
    past.current = [];
    future.current = [];
    sync();
  }, []);

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const el = document.activeElement as HTMLElement | null;
      if (el && /input|textarea|select/i.test(el.tagName)) return;
      if (el?.isContentEditable) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return {
    record,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    undoCount: past.current.length,
    redoCount: future.current.length,
  };
}
