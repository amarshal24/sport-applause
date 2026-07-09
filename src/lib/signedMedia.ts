import { supabase } from "@/integrations/supabase/client";

// Extract bucket + path from a Supabase storage URL (public or sign form).
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

const cache = new Map<string, { url: string; exp: number }>();

export async function toSignedUrl(url: string | null | undefined, expiresIn = 3600): Promise<string | null> {
  if (!url) return null;
  const parsed = parseStorageUrl(url);
  if (!parsed) return url; // not a storage URL, use as-is
  const key = `${parsed.bucket}/${parsed.path}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.exp > now + 30_000) return hit.url;
  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, expiresIn);
  if (error || !data?.signedUrl) return null;
  cache.set(key, { url: data.signedUrl, exp: now + expiresIn * 1000 });
  return data.signedUrl;
}
