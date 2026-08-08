import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "chunk-reload-attempt";

/**
 * Wraps React.lazy so that a failed dynamic import (usually caused by a stale
 * cached bundle referencing chunk files that no longer exist after a deploy)
 * triggers a one-time hard reload instead of a blank screen.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const module = await factory();
      window.sessionStorage.removeItem(RELOAD_KEY);
      return module;
    } catch (error) {
      const alreadyReloaded = window.sessionStorage.getItem(RELOAD_KEY) === "true";
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(RELOAD_KEY, "true");
        window.location.reload();
        // Keep the promise pending while the page reloads.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
