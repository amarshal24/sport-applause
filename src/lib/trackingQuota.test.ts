import { test } from "node:test";
import assert from "node:assert/strict";
import { TRACKING_LIMITS, nextTrackingSource, remainingTrackedClips, trackingAllowance } from "../../supabase/functions/_shared/trackingQuota";

test("approved limits", () => assert.deepEqual(TRACKING_LIMITS, { freeMonthly: 1, memberMonthly: 30, packLifetime: 10 }));
test("free user: 1/month, no lifetime", () => assert.deepEqual(trackingAllowance({ member: false, pack: false }), { monthlyLimit: 1, lifetimeLimit: 0 }));
test("member: 30/month", () => assert.deepEqual(trackingAllowance({ member: true, pack: false }), { monthlyLimit: 30, lifetimeLimit: 0 }));
test("pack owner keeps free monthly and adds 10 lifetime", () => assert.deepEqual(trackingAllowance({ member: false, pack: true }), { monthlyLimit: 1, lifetimeLimit: 10 }));
test("member who also owns the pack gets both", () => assert.deepEqual(trackingAllowance({ member: true, pack: true }), { monthlyLimit: 30, lifetimeLimit: 10 }));
test("monthly bucket is used before lifetime", () => {
  const a = trackingAllowance({ member: false, pack: true });
  assert.equal(nextTrackingSource(a, { monthlyUsed: 0, lifetimeUsed: 0 }), "monthly");
  assert.equal(nextTrackingSource(a, { monthlyUsed: 1, lifetimeUsed: 9 }), "lifetime");
  assert.equal(nextTrackingSource(a, { monthlyUsed: 1, lifetimeUsed: 10 }), null);
});
test("remaining never goes negative", () => assert.deepEqual(remainingTrackedClips({ monthlyLimit: 2, lifetimeLimit: 0 }, { monthlyUsed: 5, lifetimeUsed: 0 }), { monthly: 0, lifetime: 0, total: 0 }));
