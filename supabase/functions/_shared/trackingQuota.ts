// AI tracked-clip allowances per package. Pure rules shared by the edge function (authoritative)
// and the UI (display only). Prices are NOT defined here; this only sets clip allowances.
// Numbers approved by the owner on 2026-11-27: Free 2/month, Pro FX Pack 10 lifetime, Members 30/month.
export const TRACKING_LIMITS = { freeMonthly: 2, memberMonthly: 30, packLifetime: 10 } as const;

export interface TrackingEntitlements {
  /** Active Pro FX Membership subscription, or an approved Founding 100 member. */
  member: boolean;
  /** Bought the one-time Pro FX Pack (purchase row, not a founder benefit). */
  pack: boolean;
}

export interface TrackingAllowance { monthlyLimit: number; lifetimeLimit: number }

export function trackingAllowance(e: TrackingEntitlements): TrackingAllowance {
  return {
    monthlyLimit: e.member ? TRACKING_LIMITS.memberMonthly : TRACKING_LIMITS.freeMonthly,
    // The one-time pack adds a never-resetting bonus on top of the free monthly allowance, so a
    // pack owner is never worse off than a free user after the bonus runs out.
    lifetimeLimit: e.pack ? TRACKING_LIMITS.packLifetime : 0,
  };
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
