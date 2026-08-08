import { useSyncExternalStore } from "react";
import type { MusicTrack } from "@/constants/musicLibrary";

export interface EditorTrack extends MusicTrack {
  /** Original AI recommendation this track was matched from, if any */
  sourceLabel?: string;
}

// Shared store so a track picked anywhere (mood selector, recommendations)
// can be handed to the clip editor / composer.
let track: EditorTrack | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => track;

export const sendTrackToEditor = (next: EditorTrack) => {
  track = next;
  emit();
};

export const clearEditorTrack = () => {
  track = null;
  emit();
};

export const useEditorTrack = () => {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { editorTrack: current, sendTrackToEditor, clearEditorTrack };
};
