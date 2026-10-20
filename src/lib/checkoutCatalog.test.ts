import { test } from "node:test";
import assert from "node:assert/strict";
import { isCheckoutPriceAllowed, isTrustedReturnUrl, isFullyRefunded } from "../../supabase/functions/_shared/checkoutCatalog";

test("only FX and skin products can be checked out", () => {
  assert.equal(isCheckoutPriceAllowed("fx_pro_pack_onetime"), true);
  assert.equal(isCheckoutPriceAllowed("skin_elite_onetime"), true);
  assert.equal(isCheckoutPriceAllowed("podcast_tip"), false);
  assert.equal(isCheckoutPriceAllowed(undefined), false);
});

test("return address must be the same site's checkout return page", () => {
  assert.equal(isTrustedReturnUrl("https://usports.lovable.app/checkout/return?session_id=x", "https://usports.lovable.app"), true);
  assert.equal(isTrustedReturnUrl("https://evil.example/checkout/return", "https://usports.lovable.app"), false);
  assert.equal(isTrustedReturnUrl("https://usports.lovable.app/other", "https://usports.lovable.app"), false);
  assert.equal(isTrustedReturnUrl("https://usports.lovable.app/checkout/return", null), false);
});

test("access is revoked only after a full refund", () => {
  assert.equal(isFullyRefunded(999, 999), true);
  assert.equal(isFullyRefunded(500, 999), false);
});
