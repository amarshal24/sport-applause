import { supabase } from "@/integrations/supabase/client";

/**
 * Extract bucket + object path from a Supabase storage URL
 * (public ref form, signed form, or with query/hash).
 */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  if (!url) return null;
  const cleaned = url.split("#")[0];
  const m = cleaned.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

/**
 * Canonical storage reference for DB columns.
 * Same shape as getPublicUrl — not directly playable on private buckets;
 * resolve at display time with toSignedUrl / SecureMedia.
 */
export function storageRefUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

const cache = new Map<string, { url: string; exp: number }>();

export async function toSignedUrl(url: string | null | undefined, expiresIn = 3600): Promise<string | null> {
  if (!url) return null;
  const hashIdx = url.indexOf("#");
  const hash = hashIdx >= 0 ? url.slice(hashIdx) : "";
  const withoutHash = hashIdx >= 0 ? url.slice(0, hashIdx) : url;

  const parsed = parseStorageUrl(withoutHash);
  if (!parsed) return url; // not a storage URL, use as-is

  const key = `${parsed.bucket}/${parsed.path}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.exp > now + 30_000) return hit.url + hash;

  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, expiresIn);
  if (error || !data?.signedUrl) {
    // Prefer signed URL for private buckets; keep original as last resort.
    console.warn("toSignedUrl failed", parsed.bucket, error?.message);
    return url;
  }
  cache.set(key, { url: data.signedUrl, exp: now + expiresIn * 1000 });
  return data.signedUrl + hash;
}
