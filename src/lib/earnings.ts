export interface EarningRow {
  amount_cents: number;
  platform_fee_cents: number;
  creator_net_cents: number;
  refunded_cents?: number | null;
}

/** Creator net after refunds: a refund claws back the same share of the creator's net. */
export function netAfterRefund(r: EarningRow): number {
  const refunded = Math.min(r.refunded_cents ?? 0, r.amount_cents);
  if (!r.amount_cents) return r.creator_net_cents;
  return Math.round(r.creator_net_cents * (1 - refunded / r.amount_cents));
}

export function summarizeEarnings(rows: EarningRow[]) {
  return rows.reduce(
    (s, r) => ({
      gross: s.gross + r.amount_cents,
      fees: s.fees + r.platform_fee_cents,
      refunds: s.refunds + Math.min(r.refunded_cents ?? 0, r.amount_cents),
      net: s.net + netAfterRefund(r),
    }),
    { gross: 0, fees: 0, refunds: 0, net: 0 },
  );
}
