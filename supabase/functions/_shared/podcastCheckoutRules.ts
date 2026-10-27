export function podcastLiveAllowed(kind: string, enabled: string | undefined) {
  return enabled === 'true' && (kind === 'membership' || kind === 'unlock');
}
export function podcastReturnAllowed(value: unknown, origin: string | null) {
  if (typeof value !== 'string' || !origin) return false;
  try { const url = new URL(value); return url.origin === origin && ['/podcasts/thank-you','/checkout/return'].includes(url.pathname); } catch { return false; }
}
export function invoiceSubscription(invoice: { subscription?: string | null; parent?: { subscription_details?: { subscription?: string | null } | null } | null }) {
  return invoice.parent?.subscription_details?.subscription ?? invoice.subscription ?? null;
}