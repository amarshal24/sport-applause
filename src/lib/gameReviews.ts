import { z } from "zod";

export const gameReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(1, "Write your review").max(2000).refine(v => !/(https?:\/\/|www\.)/i.test(v), "Reviews cannot contain links").refine(v => !/(.)\1{19,}/.test(v), "Please avoid repeated-character spam"),
});

export function summarizeGameReviews(reviews: { rating: number }[]) {
  return { count: reviews.length, average: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0 };
}