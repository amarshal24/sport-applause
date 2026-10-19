/// <reference types="node" />
import { test } from "node:test";
import assert from "node:assert/strict";
import { gameReviewSchema, summarizeGameReviews } from "./gameReviews";

test("ratings accept only whole stars from 1 to 5", () => {
  for (const rating of [1, 2, 3, 4, 5]) assert.equal(gameReviewSchema.safeParse({ rating, body: "Fun game" }).success, true);
  for (const rating of [0, 6, 2.5]) assert.equal(gameReviewSchema.safeParse({ rating, body: "Fun game" }).success, false);
});
test("a rating requires a written review", () => {
  assert.equal(gameReviewSchema.safeParse({ rating: 4, body: "   " }).success, false);
  assert.equal(gameReviewSchema.safeParse({ rating: 4, body: "x".repeat(2001) }).success, false);
});
test("summary reflects real ratings without invented scores", () => {
  assert.deepEqual(summarizeGameReviews([{ rating: 5 }, { rating: 3 }]), { count: 2, average: 4 });
  assert.deepEqual(summarizeGameReviews([]), { count: 0, average: 0 });
});
test("review spam links and repeated characters are rejected", () => {
  for (const body of ["Visit https://spam.example", "www.spam.example", "a".repeat(20)]) assert.equal(gameReviewSchema.safeParse({rating:5,body}).success,false);
  assert.equal(gameReviewSchema.safeParse({rating:5,body:"Enjoyed the passing challenges"}).success,true);
});