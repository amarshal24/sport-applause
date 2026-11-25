/**
 * Single source of truth for public newsletter / event interest categories.
 * Imported by the client form, the public-subscriptions edge function and the tests.
 * The database validates the same list in public.valid_subscription_interests()
 * (drizzle/migrations/0033); scripts/test-newsletter-db.sh fails if the two drift apart.
 */
export const interests = [
  "basketball", "football", "soccer", "tennis", "baseball", "volleyball", "swimming", "running", "cycling", "other-sports",
  "media", "podcasts", "live-events", "coaching", "fitness", "creators",
  "gaming", "recruiting",
] as const;
export type Interest = (typeof interests)[number];
