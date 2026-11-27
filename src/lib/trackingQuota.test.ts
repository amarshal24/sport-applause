import { test } from "node:test";
import assert from "node:assert/strict";
import { TRACKING_LIMITS, nextTrackingSource, remainingTrackedClips, trackingAllowance } from "../../supabase/functions/_shared/trackingQuota";

test("approved limits", () => assert.deepEqual(TRACKING_LIMITS, { freeMonthly: 1, packMonthly: 5, memberMonthly: 15, skinMonthly: { free: 0, starter: 2, pro: 3, elite: 5 } }));
test("free user: 1/month", () => assert.deepEqual(trackingAllowance({ member: false, pack: false }), { monthlyLimit: 1, lifetimeLimit: 0 }));
test("one-time pack owner: 5/month, never lifetime", () => assert.deepEqual(trackingAllowance({ member: false, pack: true }), { monthlyLimit: 5, lifetimeLimit: 0 }));
test("member (or Founding 100): 15/month", () => assert.deepEqual(trackingAllowance({ member: true, pack: false }), { monthlyLimit: 15, lifetimeLimit: 0 }));
test("packages do not stack: member who owns the pack gets 15, not 20", () => assert.deepEqual(trackingAllowance({ member: true, pack: true }), { monthlyLimit: 15, lifetimeLimit: 0 }));
test("skin tier packs: Starter 2, Pro 3, Elite 5 per month", () => {
  const m = (skinTier: "free" | "starter" | "pro" | "elite") => trackingAllowance({ member: false, pack: false, skinTier }).monthlyLimit;
  assert.deepEqual([m("free"), m("starter"), m("pro"), m("elite")], [1, 2, 3, 5]);
});
test("skin tier allowance never lowers another package's allowance (highest wins, no stacking)", () => {
  assert.equal(trackingAllowance({ member: true, pack: false, skinTier: "elite" }).monthlyLimit, 15);
  assert.equal(trackingAllowance({ member: false, pack: true, skinTier: "starter" }).monthlyLimit, 5);
  assert.equal(trackingAllowance({ member: false, pack: true, skinTier: "elite" }).monthlyLimit, 5);
});
test("omitting skinTier behaves like no skin pack", () => assert.equal(trackingAllowance({ member: false, pack: false }).monthlyLimit, 1));
test("clips are allowed until the monthly limit, then blocked", () => {
  const a = trackingAllowance({ member: false, pack: true });
  assert.equal(nextTrackingSource(a, { monthlyUsed: 4, lifetimeUsed: 0 }), "monthly");
  assert.equal(nextTrackingSource(a, { monthlyUsed: 5, lifetimeUsed: 0 }), null);
});
test("remaining never goes negative", () => assert.deepEqual(remainingTrackedClips({ monthlyLimit: 2, lifetimeLimit: 0 }, { monthlyUsed: 5, lifetimeUsed: 0 }), { monthly: 0, lifetime: 0, total: 0 }));
