import { expect, test } from "bun:test";
import { GAME_SALES_ENABLED, gameListingSchema, summarizeGameSales } from "./creatorGames";

const listing = { title: "Court Challenge", description: "A basketball game", category: "sports", price: "3.99", launchUrl: "https://example.org/game" };
test("creators set exact prices in cents including free games", () => {
  expect(gameListingSchema.parse(listing).price).toBe(399);
  expect(gameListingSchema.parse({ ...listing, price: "0" }).price).toBe(0);
  expect(gameListingSchema.safeParse({ ...listing, price: "-1" }).success).toBe(false);
});
test("game sales remain blocked before payment safeguards pass", () => expect(GAME_SALES_ENABLED).toBe(false));
test("untrusted executable and private game addresses are rejected", () => {
  for (const launchUrl of ["javascript:alert(1)", "http://example.org", "https://localhost/game", "https://127.0.0.1/game", "https://user:pass@example.org"]) expect(gameListingSchema.safeParse({ ...listing, launchUrl }).success).toBe(false);
});
test("earnings reflect recorded fees refunds and creator net without inventing a commission", () => {
  expect(summarizeGameSales([{ amount_cents: 399, platform_fee_cents: 20, refunded_cents: 100, creator_net_cents: 284, payout_status: "paid" }])).toEqual({ gross: 399, fees: 20, refunds: 100, net: 284, paid: 284 });
});