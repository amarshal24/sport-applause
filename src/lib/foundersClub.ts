import { z } from "zod";

export const applicantTypes = ["athlete", "fan", "creator", "podcaster", "gamer", "coach"] as const;
export const foundersSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255).transform(v => v.toLowerCase()),
  applicant_type: z.enum(applicantTypes),
  reason: z.string().trim().min(1, "Tell us why you want to join").max(2000),
});