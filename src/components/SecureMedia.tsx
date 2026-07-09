import { useEffect, useState, ImgHTMLAttributes, VideoHTMLAttributes } from "react";
import { toSignedUrl } from "@/lib/signedMedia";

export function SecureImage({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const [resolved, setResolved] = useState<string | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    if (!src) { setResolved(undefined); return; }
    toSignedUrl(String(src)).then((u) => { if (alive) setResolved(u || undefined); });
    return () => { alive = false; };
  }, [src]);
  if (!resolved) return <div {...(rest as any)} />;
  return <img src={resolved} {...rest} />;
}

export function SecureVideo({ src, ...rest }: VideoHTMLAttributes<HTMLVideoElement>) {
  const [resolved, setResolved] = useState<string | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    if (!src) { setResolved(undefined); return; }
    toSignedUrl(String(src)).then((u) => { if (alive) setResolved(u || undefined); });
    return () => { alive = false; };
  }, [src]);
  if (!resolved) return <div {...(rest as any)} />;
  return <video src={resolved} {...rest} />;
}
