// AI tracked-clip allowances per package. Pure rules shared by the edge function (authoritative)
// and the UI (display only). Prices are NOT defined here; this only sets clip allowances.
// Owner decisions: Free 1/month (2026-11-27), one-time Pro FX Pack 5/month (2026-11-27, replaces the
// earlier 10-lifetime choice), Members and Founding 100 members 30/month, lowered to 15/month on 2026-11-27.
export const TRACKING_LIMITS = {
  freeMonthly: 1, packMonthly: 5, memberMonthly: 15,
  // One-time skin tier packs (owner decision 2026-11-27, sized to stay profitable for ~24 months worst case).
  skinMonthly: { free: 0, starter: 2, pro: 3, elite: 5 },
} as const;

export type TrackingSkinTier = keyof typeof TRACKING_LIMITS.skinMonthly;

export interface TrackingEntitlements {
  /** Active Pro FX Membership subscription, or an approved Founding 100 member. */
  member: boolean;
  /** Bought the one-time Pro FX Pack (purchase row, not a founder benefit). */
  pack: boolean;
  /** Highest skin tier owned by purchase (matches usePremium's skinTier; "free" when none). */
  skinTier?: TrackingSkinTier;
}

/** lifetimeLimit stays 0 for every package: the database still supports a lifetime bucket, no package uses it. */
export interface TrackingAllowance { monthlyLimit: number; lifetimeLimit: number }

export function trackingAllowance(e: TrackingEntitlements): TrackingAllowance {
  // Highest applicable monthly allowance; packages do not stack.
  const monthlyLimit = Math.max(
    TRACKING_LIMITS.freeMonthly,
    e.pack ? TRACKING_LIMITS.packMonthly : 0,
    e.member ? TRACKING_LIMITS.memberMonthly : 0,
    TRACKING_LIMITS.skinMonthly[e.skinTier ?? "free"],
  );
  return { monthlyLimit, lifetimeLimit: 0 };
}

export interface TrackingUsage { monthlyUsed: number; lifetimeUsed: number }

/** Mirrors consume_tracking_clip: monthly bucket first, then lifetime. */
export function nextTrackingSource(a: TrackingAllowance, u: TrackingUsage): "monthly" | "lifetime" | null {
  if (u.monthlyUsed < a.monthlyLimit) return "monthly";
  if (u.lifetimeUsed < a.lifetimeLimit) return "lifetime";
  return null;
}

export function remainingTrackedClips(a: TrackingAllowance, u: TrackingUsage) {
  const monthly = Math.max(0, a.monthlyLimit - u.monthlyUsed), lifetime = Math.max(0, a.lifetimeLimit - u.lifetimeUsed);
  return { monthly, lifetime, total: monthly + lifetime };
}
