import { z } from "zod";

export const founding100Roles = ["athlete", "coach", "creator", "podcaster", "fan"] as const;
export const founding100Sports = ["basketball", "football", "soccer", "tennis", "volleyball", "baseball", "swimming", "running", "cycling", "gym", "hiking", "other"] as const;
export const founding100Statuses = ["applied", "selected", "waitlisted", "rejected"] as const;
export const FOUNDING100_CAP = 100;

export const founding100Schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255).transform(v => v.toLowerCase()),
  role: z.enum(founding100Roles),
  sport: z.enum(founding100Sports),
  social_username: z.string().trim().max(100).optional().default(""),
  beta_interest: z.boolean(),
  newsletter_consent: z.boolean(),
});

export const remainingSpots = (selected: number) => Math.max(0, FOUNDING100_CAP - Math.min(selected, FOUNDING100_CAP));
