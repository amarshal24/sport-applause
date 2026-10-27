export function founderBenefits(selected: boolean) {
  return { proFx: selected, skinTier: selected ? 'elite' as const : 'free' as const };
}
export function settledCheckout(status: string | null) {
  return status === 'paid' || status === 'no_payment_required';
}
export function creatorNet(amount: number, fee: number, refunded: number) {
  if (amount <= 0) return 0;
  return Math.max(0, amount - fee - Math.round(Math.min(amount, refunded) * (amount - fee) / amount));
}