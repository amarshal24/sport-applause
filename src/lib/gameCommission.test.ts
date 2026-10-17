import { test } from "node:test";
import assert from "node:assert/strict";
import { GAME_COMMISSION_PERCENT, gameCommissionCents } from "./gameCommission";
test("game platform commission is 15 percent with cent rounding", () => {
  assert.equal(GAME_COMMISSION_PERCENT, 15);
  assert.equal(gameCommissionCents(1000), 150);
  assert.equal(gameCommissionCents(499), 75);
});