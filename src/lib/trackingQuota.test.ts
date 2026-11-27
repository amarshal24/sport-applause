import { test } from "node:test";
import assert from "node:assert/strict";
import { TRACKING_LIMITS, nextTrackingSource, remainingTrackedClips, trackingAllowance } from "../../supabase/functions/_shared/trackingQuota";

test("approved limits", () => assert.deepEqual(TRACKING_LIMITS, { freeMonthly: 1, packMonthly: 5, memberMonthly: 30 }));
test("free user: 1/month", () => assert.deepEqual(trackingAllowance({ member: false, pack: false }), { monthlyLimit: 1, lifetimeLimit: 0 }));
test("one-time pack owner: 5/month, never lifetime", () => assert.deepEqual(trackingAllowance({ member: false, pack: true }), { monthlyLimit: 5, lifetimeLimit: 0 }));
test("member (or Founding 100): 30/month", () => assert.deepEqual(trackingAllowance({ member: true, pack: false }), { monthlyLimit: 30, lifetimeLimit: 0 }));
test("packages do not stack: member who owns the pack gets 30, not 35", () => assert.deepEqual(trackingAllowance({ member: true, pack: true }), { monthlyLimit: 30, lifetimeLimit: 0 }));
test("clips are allowed until the monthly limit, then blocked", () => {
  const a = trackingAllowance({ member: false, pack: true });
  assert.equal(nextTrackingSource(a, { monthlyUsed: 4, lifetimeUsed: 0 }), "monthly");
  assert.equal(nextTrackingSource(a, { monthlyUsed: 5, lifetimeUsed: 0 }), null);
});
test("remaining never goes negative", () => assert.deepEqual(remainingTrackedClips({ monthlyLimit: 2, lifetimeLimit: 0 }, { monthlyUsed: 5, lifetimeUsed: 0 }), { monthly: 0, lifetime: 0, total: 0 }));
