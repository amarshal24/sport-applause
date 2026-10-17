export const GAME_COMMISSION_PERCENT = 15;
export const gameCommissionCents = (amount: number) => Math.round(amount * GAME_COMMISSION_PERCENT / 100);