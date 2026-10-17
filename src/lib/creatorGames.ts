import { z } from "zod";

export const GAME_CATEGORIES = ["sports", "racing", "arcade", "puzzle", "adventure", "strategy"] as const;
export const GAME_SALES_ENABLED = false;
export const gameListingSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(2000),
  category: z.enum(GAME_CATEGORIES),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a price with up to two decimal places").transform(v => Math.round(Number(v) * 100)).refine(v => v <= 100000, "Maximum price is $1,000"),
  launchUrl: z.string().max(2000).url().refine(v => {
    const url = new URL(v);
    return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") && /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url.hostname) && !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname);
  }, "Use a public HTTPS game address"),
});
export const gameMoney = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
export function summarizeGameSales(sales: { amount_cents: number; platform_fee_cents: number; refunded_cents: number; creator_net_cents: number; payout_status: string }[]) {
  return sales.reduce((total, sale) => ({
    gross: total.gross + sale.amount_cents,
    fees: total.fees + sale.platform_fee_cents,
    refunds: total.refunds + sale.refunded_cents,
    net: total.net + sale.creator_net_cents,
    paid: total.paid + (sale.payout_status === "paid" ? sale.creator_net_cents : 0),
  }), { gross: 0, fees: 0, refunds: 0, net: 0, paid: 0 });
}