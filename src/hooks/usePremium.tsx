import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";
import {
  SKIN_TIER_PRICE_IDS,
  SKIN_TIER_RANK,
  type SkinTier,
} from "@/constants/skinTiers";

const PRO_FX_PRICE_IDS = ["fx_pro_pack_onetime"];

/**
 * Premium (PRO FX) access. True when the user bought the one-time
 * Pro FX Pack or has an active Pro FX Membership.
 */
export const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [hasPack, setHasPack] = useState(false);
  const [skinTier, setSkinTier] = useState<SkinTier>("free");
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [skinStoreOpen, setSkinStoreOpen] = useState(false);


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
      setHasPack(false);
      setSkinTier("free");
      setSubStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [purchases, subs] = await Promise.all([
      supabase
        .from("fx_purchases")
        .select("price_id")
        .eq("user_id", user.id)
        .eq("environment", environment),
      supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", user.id)
        .eq("environment", environment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const priceIds = (purchases.data ?? []).map((p) => p.price_id as string);
    const hasPack = priceIds.some((id) => PRO_FX_PRICE_IDS.includes(id));
    const sub = subs.data;
    const periodOk =
      !sub?.current_period_end || new Date(sub.current_period_end) > new Date();
    const hasSub = !!sub &&
      ((["active", "trialing", "past_due"].includes(sub.status) && periodOk) ||
        (sub.status === "canceled" && periodOk && !!sub.current_period_end));
    const premium = hasPack || hasSub;

    // Highest skin tier owned; PRO FX access includes every tier.
    let tier: SkinTier = premium ? "elite" : "free";
    priceIds.forEach((id) => {
      const t = SKIN_TIER_PRICE_IDS[id];
      if (t && SKIN_TIER_RANK[t] > SKIN_TIER_RANK[tier]) tier = t;
    });

    setHasPack(hasPack);
    setSkinTier(tier);
    setSubStatus(sub?.status ?? null);
    setIsPremium(premium);
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

  const requestSkinTier = useCallback(() => setSkinStoreOpen(true), []);
  const closeSkinStore = useCallback(() => {
    setSkinStoreOpen(false);
    refresh();
  }, [refresh]);

  return {
    isPremium,
    hasPack,
    skinTier,
    subStatus,
    isPastDue: subStatus === "past_due",
    loading,
    upgradeOpen,
    requestUpgrade,
    closeUpgrade,
    skinStoreOpen,
    requestSkinTier,
    closeSkinStore,
    refresh,
  };
};

