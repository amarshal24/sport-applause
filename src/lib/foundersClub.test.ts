/// <reference types="node" />
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { applicantTypes, foundersSchema } from "./foundersClub";

const application = { name: "Test Applicant", email: "founder@example.com", applicant_type: "athlete", reason: "I want to join the sports community." };
describe("Founders Club applications", () => {
  test("accepts exactly the six requested applicant types", () => {
    assert.deepEqual([...applicantTypes], ["athlete", "fan", "creator", "podcaster", "gamer", "coach"]);
    for (const applicant_type of applicantTypes) assert.equal(foundersSchema.safeParse({ ...application, applicant_type }).success, true);
    assert.equal(foundersSchema.safeParse({ ...application, applicant_type: "admin" }).success, false);
  });
  test("requires name, valid email and reason", () => {
    for (const field of ["name", "email", "reason"]) assert.equal(foundersSchema.safeParse({ ...application, [field]: "" }).success, false);
    assert.equal(foundersSchema.safeParse({ ...application, email: "not-an-email" }).success, false);
  });
});