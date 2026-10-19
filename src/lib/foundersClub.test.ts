import { describe, expect, test } from "bun:test";
import { applicantTypes, foundersSchema } from "./foundersClub";

const application = { name: "Test Applicant", email: "founder@example.com", applicant_type: "athlete", reason: "I want to join the sports community." };
describe("Founders Club applications", () => {
  test("accepts exactly the six requested applicant types", () => {
    expect([...applicantTypes]).toEqual(["athlete", "fan", "creator", "podcaster", "gamer", "coach"]);
    for (const applicant_type of applicantTypes) expect(foundersSchema.safeParse({ ...application, applicant_type }).success).toBe(true);
    expect(foundersSchema.safeParse({ ...application, applicant_type: "admin" }).success).toBe(false);
  });
  test("requires name, valid email and reason", () => {
    for (const field of ["name", "email", "reason"]) expect(foundersSchema.safeParse({ ...application, [field]: "" }).success).toBe(false);
    expect(foundersSchema.safeParse({ ...application, email: "not-an-email" }).success).toBe(false);
  });
});