import { z } from "zod";
import { interests } from "../../supabase/functions/_shared/subscriptionTopics";
export { interests };
export const subscriptionSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  interests: z.array(z.enum(interests)).min(1, "Choose at least one interest").max(interests.length).transform(v => [...new Set(v)]),
  newsletter: z.boolean(), events: z.boolean(),
}).refine(v => v.newsletter || v.events, "Choose newsletter or event updates");