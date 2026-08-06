import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";

/**
 * Premium (PRO FX) access. True when the user bought the one-time
 * Pro FX Pack or has an active Pro FX Membership.
 */
export const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const environment = (() => {
    try {
      return getStripeEnvironment();
    } catch {
      return "sandbox" as const;
    }
  })();

  const refresh = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [purchases, subs] = await Promise.all([
      supabase
        .from("fx_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("environment", environment)
        .limit(1),
      supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", user.id)
        .eq("environment", environment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const hasPack = (purchases.data?.length ?? 0) > 0;
    const sub = subs.data;
    const periodOk =
      !sub?.current_period_end || new Date(sub.current_period_end) > new Date();
    const hasSub = !!sub &&
      ((["active", "trialing", "past_due"].includes(sub.status) && periodOk) ||
        (sub.status === "canceled" && periodOk && !!sub.current_period_end));

    setIsPremium(hasPack || hasSub);
    setLoading(false);
  }, [user, environment]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestUpgrade = useCallback(() => setUpgradeOpen(true), []);
  const closeUpgrade = useCallback(() => {
    setUpgradeOpen(false);
    refresh();
  }, [refresh]);

  return { isPremium, loading, upgradeOpen, requestUpgrade, closeUpgrade, refresh };
};
