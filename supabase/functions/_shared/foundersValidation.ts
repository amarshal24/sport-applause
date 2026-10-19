import { z } from "npm:zod@3.25.76";

export const foundersApplicationSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255).transform(v => v.toLowerCase()),
  applicant_type: z.enum(["athlete", "fan", "creator", "podcaster", "gamer", "coach"]),
  reason: z.string().trim().min(1, "Tell us why you want to join").max(2000),
  website: z.string().max(0).optional(),
}).strict();