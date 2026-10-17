export interface ProtectedGameLaunch { url: string; token: string; expires_in: number; preview: boolean }

export function protectedGameUrl(launch: ProtectedGameLaunch, gameId: string): string {
  const url = new URL(launch.url);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid game address");
  // Fragments are not sent in HTTP requests or Referer headers. The host's
  // browser code forwards authorization to its own server and clears it.
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set("usportz_token", launch.token);
  fragment.set("usportz_game", gameId);
  url.hash = fragment.toString();
  return url.toString();
}