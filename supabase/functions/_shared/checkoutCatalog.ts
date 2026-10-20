// Only these FX / skin products can be bought through the generic checkout.
export const CHECKOUT_PRICE_IDS = [
  "fx_pro_pack_onetime",
  "fx_pro_monthly",
  "skin_starter_onetime",
  "skin_pro_onetime",
  "skin_elite_onetime",
] as const;

export function isCheckoutPriceAllowed(priceId: unknown): priceId is string {
  return typeof priceId === "string" && (CHECKOUT_PRICE_IDS as readonly string[]).includes(priceId);
}

/** Return URL must stay on the caller's own site and land on the checkout return page. */
export function isTrustedReturnUrl(returnUrl: unknown, origin: string | null): boolean {
  if (typeof returnUrl !== "string" || !origin) return false;
  try {
    const url = new URL(returnUrl);
    return url.origin === origin && url.pathname === "/checkout/return";
  } catch {
    return false;
  }
}

/** A one-time purchase loses access once the charge is fully refunded. */
export function isFullyRefunded(amountRefunded: number, amountCaptured: number): boolean {
  return amountCaptured > 0 && amountRefunded >= amountCaptured;
}
