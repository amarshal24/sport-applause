import { useState, useCallback } from "react";

/**
 * Lightweight premium hook. Returns `isPremium=false` by default.
 * When Stripe payments are wired up, this hook can be swapped to read
 * the live subscription status from a `subscribers` table / edge function.
 */
export const usePremium = () => {
  const [isPremium] = useState<boolean>(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const requestUpgrade = useCallback(() => setUpgradeOpen(true), []);
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);

  return { isPremium, upgradeOpen, requestUpgrade, closeUpgrade };
};
