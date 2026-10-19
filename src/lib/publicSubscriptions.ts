import { z } from "zod";
export const interests = ["basketball", "football", "soccer", "tennis", "baseball", "volleyball", "swimming", "running", "cycling", "other-sports", "media", "podcasts", "live-events", "coaching", "fitness", "creators"] as const;
export const subscriptionSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  interests: z.array(z.enum(interests)).min(1, "Choose at least one interest").max(16).transform(v => [...new Set(v)]),
  newsletter: z.boolean(), events: z.boolean(),
}).refine(v => v.newsletter || v.events, "Choose newsletter or event updates");