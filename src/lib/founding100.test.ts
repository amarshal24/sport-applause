import { describe, expect, it } from "bun:test";
import { founding100Schema, remainingSpots, FOUNDING100_CAP } from "./founding100";

const valid = { name: "Ava Athlete", email: "AVA@Example.com", role: "athlete", sport: "soccer", social_username: "@ava", beta_interest: true, newsletter_consent: false };

describe("founding100Schema", () => {
  it("accepts a valid application and lowercases email", () => {
    const parsed = founding100Schema.parse(valid);
    expect(parsed.email).toBe("ava@example.com");
  });
  it("rejects each invalid role and accepts all five allowed roles", () => {
    expect(founding100Schema.safeParse({ ...valid, role: "gamer" }).success).toBe(false);
    for (const role of ["athlete", "coach", "creator", "podcaster", "fan"]) {
      expect(founding100Schema.safeParse({ ...valid, role }).success).toBe(true);
    }
  });
  it("rejects empty name, bad email and unknown sport", () => {
    expect(founding100Schema.safeParse({ ...valid, name: " " }).success).toBe(false);
    expect(founding100Schema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(founding100Schema.safeParse({ ...valid, sport: "quidditch" }).success).toBe(false);
  });
  it("allows an omitted social username and defaults it to empty", () => {
    const { social_username, ...rest } = valid;
    expect(founding100Schema.parse(rest).social_username).toBe("");
  });
  it("requires boolean consent flags", () => {
    expect(founding100Schema.safeParse({ ...valid, newsletter_consent: "yes" }).success).toBe(false);
  });
});

describe("remainingSpots", () => {
  it("counts down from 100 and never goes negative", () => {
    expect(remainingSpots(0)).toBe(100);
    expect(remainingSpots(37)).toBe(63);
    expect(remainingSpots(100)).toBe(0);
    expect(remainingSpots(140)).toBe(0);
    expect(FOUNDING100_CAP).toBe(100);
  });
});
