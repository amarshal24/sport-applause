export const GAME_PASS_PRICES = { gaming_all_star_monthly: 399, gaming_mvp_monthly: 799 } as const;
export function gamePassTier(priceId: string, status: string, periodEnd: string | null, environment: string, requestedEnvironment: string, libraryReady: boolean, now = Date.now()): 'free' | 'all_star' | 'mvp' {
  if (!libraryReady || environment !== requestedEnvironment || !['active', 'trialing', 'canceled'].includes(status) || (periodEnd !== null && Date.parse(periodEnd) <= now) || (status === 'canceled' && periodEnd === null)) return 'free';
  if (priceId === 'gaming_mvp_monthly') return 'mvp';
  return priceId === 'gaming_all_star_monthly' ? 'all_star' : 'free';
}
export function liveGameReady(checks: { approval: boolean; host: boolean; settlement: boolean; refunds: boolean; disputes: boolean; payouts: boolean; fees: boolean; native: boolean; nativeBilling: boolean }) {
  return checks.approval && checks.host && checks.settlement && checks.refunds && checks.disputes && checks.payouts && checks.fees && (!checks.native || checks.nativeBilling);
}