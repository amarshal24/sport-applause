import { test } from "node:test";
import assert from "node:assert/strict";
import { isPublicCheckoutAllowed } from "../../supabase/functions/_shared/paymentApproval";
test("real-money checkout requires explicit server approval",()=>{
  assert.equal(isPublicCheckoutAllowed("live",undefined),false);
  assert.equal(isPublicCheckoutAllowed("live","false"),false);
  assert.equal(isPublicCheckoutAllowed("live","true"),true);
  assert.equal(isPublicCheckoutAllowed("sandbox",undefined),true);
});