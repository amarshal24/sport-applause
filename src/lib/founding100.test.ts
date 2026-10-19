/// <reference types="node" />
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { founding100Schema, remainingSpots, FOUNDING100_CAP } from "./founding100";

const valid = { name: "Ava Athlete", email: "AVA@Example.com", role: "athlete", sport: "soccer", social_username: "@ava", beta_interest: true, newsletter_consent: false };

describe("founding100Schema", () => {
  it("accepts a valid application and lowercases email", () => {
    assert.equal(founding100Schema.parse(valid).email, "ava@example.com");
  });
  it("rejects invalid roles and accepts all five allowed roles", () => {
    assert.equal(founding100Schema.safeParse({ ...valid, role: "gamer" }).success, false);
    for (const role of ["athlete", "coach", "creator", "podcaster", "fan"]) {
      assert.equal(founding100Schema.safeParse({ ...valid, role }).success, true);
    }
  });
  it("rejects empty name, bad email and unknown sport", () => {
    assert.equal(founding100Schema.safeParse({ ...valid, name: " " }).success, false);
    assert.equal(founding100Schema.safeParse({ ...valid, email: "nope" }).success, false);
    assert.equal(founding100Schema.safeParse({ ...valid, sport: "quidditch" }).success, false);
  });
  it("allows an omitted social username and defaults it to empty", () => {
    const { social_username, ...rest } = valid;
    assert.equal(founding100Schema.parse(rest).social_username, "");
  });
  it("requires boolean consent flags", () => {
    assert.equal(founding100Schema.safeParse({ ...valid, newsletter_consent: "yes" }).success, false);
  });
});

describe("remainingSpots", () => {
  it("counts down from 100 and never goes negative", () => {
    assert.equal(remainingSpots(0), 100);
    assert.equal(remainingSpots(37), 63);
    assert.equal(remainingSpots(100), 0);
    assert.equal(remainingSpots(140), 0);
    assert.equal(FOUNDING100_CAP, 100);
  });
});
