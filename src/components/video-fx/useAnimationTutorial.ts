import { useEffect, useState } from "react";

export const TUTORIAL_KEY = "animation-center-tutorial-seen-v1";

export function useAnimationTutorialAutoOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) {
        setOpen(true);
      }
    } catch {}
  }, []);
  return [open, setOpen] as const;
}
