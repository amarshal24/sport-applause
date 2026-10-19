// Lightweight analytics events: pushed to window.dataLayer so a tag manager
// (added at deployment time) can forward them without code changes.
declare global {
  interface Window { dataLayer?: Record<string, unknown>[]; }
}

export function trackEvent(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...props, ts: Date.now() });
}

export function trackPageView(path: string) {
  trackEvent("page_view", { path });
}
