import { describe, expect, test } from "bun:test";
import { GAME_PACKAGES, canBuyGamePackage } from "./gamePackages";

const pkg = (id: string) => GAME_PACKAGES.find((p) => p.id === id)!;

describe("game packages", () => {
  test("Rookie Pass is free", () => expect(pkg("rookie").priceCents).toBe(0));
  test("All-Star Pass costs $3.99 per month", () => expect(pkg("all_star").priceCents).toBe(399));
  test("MVP Unlimited costs $7.99 per month", () => expect(pkg("mvp").priceCents).toBe(799));
  test("paid packages cannot be bought yet", () => {
    expect(canBuyGamePackage(pkg("all_star"))).toBe(false);
    expect(canBuyGamePackage(pkg("mvp"))).toBe(false);
  });
});