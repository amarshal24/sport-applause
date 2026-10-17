/// <reference types="node" />
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { GAME_PACKAGES, canBuyGamePackage } from "./gamePackages";

const pkg = (id: string) => {
  const result = GAME_PACKAGES.find((p) => p.id === id);
  if (!result) throw new Error(`Missing package: ${id}`);
  return result;
};

describe("game packages", () => {
  test("Rookie Pass is free", () => assert.equal(pkg("rookie").priceCents, 0));
  test("All-Star Pass costs $3.99 per month", () => assert.equal(pkg("all_star").priceCents, 399));
  test("MVP Unlimited costs $7.99 per month", () => assert.equal(pkg("mvp").priceCents, 799));
  test("Rookie includes the requested free games and daily challenges", () => {
    assert.deepEqual(pkg("rookie").includes, ["Basketball shooting", "Soccer penalty kicks", "Football target passing", "Sports trivia", "Daily challenges"]);
  });
  test("All-Star includes Rookie and cosmetics", () => {
    assert.ok(pkg("all_star").includes.includes("Everything in Rookie"));
    assert.ok(pkg("all_star").includes.includes("Exclusive cosmetics"));
  });
  test("MVP includes All-Star and early access", () => {
    assert.ok(pkg("mvp").includes.includes("Everything in All-Star"));
    assert.ok(pkg("mvp").includes.includes("Early access to new titles"));
  });
  test("paid packages cannot be bought yet", () => {
    assert.equal(canBuyGamePackage(pkg("all_star")), false);
    assert.equal(canBuyGamePackage(pkg("mvp")), false);
  });
});