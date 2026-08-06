import { useCallback, useRef, useState } from "react";

interface SetOptions {
  /**
   * When provided, consecutive commits sharing the same key within
   * `coalesceMs` are merged into a single history entry (e.g. dragging a pin).
   */
  coalesceKey?: string;
  /** Apply the change without creating a history entry. */
  skipHistory?: boolean;
}

const COALESCE_MS = 700;
const MAX_HISTORY = 50;

/**
 * State container with undo/redo history.
 * Returns the current value plus commit/undo/redo/reset helpers.
 */
export function useUndoableState<T>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastCoalesce = useRef<{ key: string; at: number } | null>(null);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);

  const set = useCallback(
    (updater: T | ((prev: T) => T), options: SetOptions = {}) => {
      setValue((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        if (Object.is(next, prev)) return prev;

        if (!options.skipHistory) {
          const now = Date.now();
          const coalesce =
            options.coalesceKey &&
            lastCoalesce.current &&
            lastCoalesce.current.key === options.coalesceKey &&
            now - lastCoalesce.current.at < COALESCE_MS;

          if (!coalesce) {
            past.current = [...past.current, prev].slice(-MAX_HISTORY);
          }
          lastCoalesce.current = options.coalesceKey
            ? { key: options.coalesceKey, at: now }
            : null;
          future.current = [];
        }
        return next;
      });
      rerender();
    },
    [rerender]
  );

  const undo = useCallback(() => {
    setValue((current) => {
      if (past.current.length === 0) return current;
      const prev = past.current[past.current.length - 1];
      past.current = past.current.slice(0, -1);
      future.current = [current, ...future.current].slice(0, MAX_HISTORY);
      lastCoalesce.current = null;
      return prev;
    });
    rerender();
  }, [rerender]);

  const redo = useCallback(() => {
    setValue((current) => {
      if (future.current.length === 0) return current;
      const next = future.current[0];
      future.current = future.current.slice(1);
      past.current = [...past.current, current].slice(-MAX_HISTORY);
      lastCoalesce.current = null;
      return next;
    });
    rerender();
  }, [rerender]);

  const reset = useCallback(
    (nextValue: T) => {
      past.current = [];
      future.current = [];
      lastCoalesce.current = null;
      setValue(nextValue);
      rerender();
    },
    [rerender]
  );

  return {
    value,
    set,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
