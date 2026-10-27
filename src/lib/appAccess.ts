export const publicPaths = ['/', '/welcome', '/founding100', '/updates', '/thank-you', '/unsubscribe', '/auth', '/terms', '/privacy', '/.lovable/oauth/consent'] as const;
export function isPublicPath(path: string) {
  return publicPaths.some(p => p === path.replace(/\/$/, '') || (p === '/' && path === '/'));
}
export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/';
  try {
    const url = new URL(value, 'https://app.invalid');
    if (url.origin !== 'https://app.invalid' || url.pathname === '/auth') return '/';
    return url.pathname + url.search + url.hash;
  } catch { return '/'; }
}
export function signInDestination(path: string) {
  return '/auth?next=' + encodeURIComponent(safeNextPath(path));
}