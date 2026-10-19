import { z } from "npm:zod@3.25.76";

export const founding100Roles = ["athlete", "coach", "creator", "podcaster", "fan"] as const;
export const founding100Sports = ["basketball", "football", "soccer", "tennis", "volleyball", "baseball", "swimming", "running", "cycling", "gym", "hiking", "other"] as const;

export const founding100ApplicationSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255).transform(v => v.toLowerCase()),
  role: z.enum(founding100Roles),
  sport: z.enum(founding100Sports),
  social_username: z.string().trim().max(100).optional().default(""),
  beta_interest: z.boolean(),
  newsletter_consent: z.boolean(),
  website: z.string().max(0).optional(),
}).strict();
