import {
  useEffect,
  useState,
  AudioHTMLAttributes,
  ImgHTMLAttributes,
  VideoHTMLAttributes,
} from "react";
import { toSignedUrl } from "@/lib/signedMedia";

function useSignedSrc(src: string | undefined) {
  const [resolved, setResolved] = useState<string | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    if (!src) {
      setResolved(undefined);
      return;
    }
    const raw = String(src);
    toSignedUrl(raw)
      .then((u) => {
        if (alive) setResolved(u || raw);
      })
      .catch(() => {
        if (alive) setResolved(raw);
      });
    return () => {
      alive = false;
    };
  }, [src]);
  return resolved;
}

export function SecureImage({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const resolved = useSignedSrc(src ? String(src) : undefined);
  if (!resolved) {
    return <div className={rest.className} aria-hidden style={{ background: "transparent" }} />;
  }
  return <img src={resolved} {...rest} />;
}

export function SecureVideo({ src, poster, ...rest }: VideoHTMLAttributes<HTMLVideoElement>) {
  const resolved = useSignedSrc(src ? String(src) : undefined);
  const resolvedPoster = useSignedSrc(poster ? String(poster) : undefined);
  if (!resolved) {
    return <div className={rest.className} aria-hidden style={{ background: "transparent" }} />;
  }
  return <video src={resolved} poster={resolvedPoster} {...rest} />;
}

export function SecureAudio({ src, ...rest }: AudioHTMLAttributes<HTMLAudioElement>) {
  const resolved = useSignedSrc(src ? String(src) : undefined);
  if (!resolved) {
    return (
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" aria-hidden />
    );
  }
  return <audio src={resolved} {...rest} />;
}
