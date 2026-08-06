// Bakes the selected color-look + animated overlay filters directly into a
// re-encoded video file so the saved/uploaded clip contains the effect.
import { getColorFilterStyle, type ColorFilterType, type FilterType } from "@/components/AnimatedFilters";

const cssFilterFor = (type: ColorFilterType): string => {
  const style = getColorFilterStyle(type);
  return (style.filter as string) || "none";
};

type Painter = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) => void;

const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const painters: Partial<Record<FilterType, Painter>> = {
  sparkle: (ctx, w, h, t) => {
    for (let i = 0; i < 12; i++) {
      const p = ((t + i * 0.15) % 2) / 2;
      const a = Math.sin(p * Math.PI);
      ctx.globalAlpha = a;
      ctx.fillStyle = "#f59e0b";
      const r = 4 + a * 6;
      ctx.beginPath();
      ctx.arc(rand(i + 1) * w, rand(i + 21) * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  fire: (ctx, w, h, t) => {
    for (let i = 0; i < 8; i++) {
      const p = ((t + i * 0.2) % 1.5) / 1.5;
      const x = (i / 8) * w + w / 16;
      const y = h - p * h * 0.45;
      const r = (w / 22) * (1 + p);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(249,115,22,${0.8 * (1 - p)})`);
      g.addColorStop(1, "rgba(249,115,22,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  confetti: (ctx, w, h, t) => {
    const colors = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];
    for (let i = 0; i < 20; i++) {
      const dur = 2 + rand(i + 5);
      const p = ((t + i * 0.1) % dur) / dur;
      const x = rand(i + 3) * w + (rand(i + 9) - 0.5) * 40 * p;
      const y = p * h * 1.05;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p * Math.PI * 4);
      ctx.fillStyle = colors[i % colors.length];
      const s = Math.max(6, w / 90);
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-s / 2, -s / 2, s, s);
      }
      ctx.restore();
    }
  },
  glow: (ctx, w, h, t) => {
    const a = 0.35 + 0.25 * Math.sin((t / 2) * Math.PI * 2);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.4);
    g.addColorStop(0, `rgba(139,92,246,${a})`);
    g.addColorStop(1, "rgba(139,92,246,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  victory: (ctx, w, h, t) => {
    const a = 0.6 + 0.4 * Math.sin((t / 1.5) * Math.PI * 2);
    ctx.globalAlpha = a;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = Math.max(4, w / 90);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const p = ((t + i * 0.15) % 1);
      ctx.globalAlpha = Math.sin(p * Math.PI);
      ctx.fillStyle = "#facc15";
      const bh = h * 0.12 * (0.5 + p);
      ctx.fillRect((i / 6) * w + w / 12, h / 2 - bh / 2, Math.max(3, w / 200), bh);
    }
    ctx.globalAlpha = 1;
  },
  slowmo: (ctx, w, h, t) => {
    for (let i = 0; i < 5; i++) {
      const p = ((t + i * 0.3) % 2) / 2;
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.6;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, h * (0.2 + i * 0.15), w, Math.max(2, h / 400));
    }
    ctx.globalAlpha = 1;
    drawBadge(ctx, w, h, "SLOW-MO", "rgba(0,0,0,0.45)", "left");
  },
  replay: (ctx, w, h, t) => {
    ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin((t / 1.5) * Math.PI));
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = Math.max(4, w / 90);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
    ctx.globalAlpha = 1;
    drawBadge(ctx, w, h, "● REPLAY", "rgba(239,68,68,0.85)", "right");
  },
  champion: (ctx, w, h, t) => {
    for (let i = 0; i < 10; i++) {
      const p = ((t + i * 0.2) % 1.5) / 1.5;
      ctx.globalAlpha = Math.sin(p * Math.PI);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(rand(i + 11) * w, rand(i + 31) * h, Math.max(3, w / 180), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = `${Math.round(h * 0.09)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("👑", w / 2, h * 0.02 + Math.sin(t * Math.PI) * 4);
  },

  /* ---------- PRO painters ---------- */
  lightning: (ctx, w, h, t) => {
    const flash = Math.max(0, Math.sin(t * Math.PI * 2)) ** 6;
    ctx.globalAlpha = flash * 0.55;
    ctx.fillStyle = "#fde047";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const seed = Math.floor(t * 4) + i;
      ctx.strokeStyle = `rgba(250,204,21,${0.4 + flash * 0.6})`;
      ctx.lineWidth = Math.max(2, w / 260);
      ctx.beginPath();
      let x = rand(seed) * w;
      ctx.moveTo(x, 0);
      for (let y = 0; y < h; y += h / 8) {
        x += (rand(seed + y) - 0.5) * w * 0.15;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  },
  smoke: (ctx, w, h, t) => {
    for (let i = 0; i < 14; i++) {
      const p = ((t + i * 0.2) % 3) / 3;
      const x = rand(i + 2) * w;
      const y = h - p * h;
      const r = (w / 12) * (0.4 + p);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(156,163,175,${0.35 * (1 - p)})`);
      g.addColorStop(1, "rgba(156,163,175,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  embers: (ctx, w, h, t) => {
    for (let i = 0; i < 26; i++) {
      const dur = 2 + rand(i) * 1.5;
      const p = ((t + i * 0.13) % dur) / dur;
      const x = rand(i + 7) * w + Math.sin((t + i) * 2) * w * 0.02;
      const y = h - p * h * 1.05;
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.9;
      ctx.fillStyle = i % 3 === 0 ? "#fbbf24" : "#f97316";
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, w / 300) * (1.4 - p), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  snow: (ctx, w, h, t) => {
    ctx.fillStyle = "#e0f2fe";
    for (let i = 0; i < 40; i++) {
      const dur = 3 + rand(i + 4) * 2;
      const p = ((t + i * 0.09) % dur) / dur;
      const x = rand(i + 13) * w + Math.sin((t + i) * 1.5) * w * 0.03;
      const y = p * h * 1.05;
      ctx.globalAlpha = 0.5 + rand(i) * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, w / 380) * (0.6 + rand(i + 1)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  shockwave: (ctx, w, h, t) => {
    for (let i = 0; i < 3; i++) {
      const p = ((t + i * 0.6) % 1.8) / 1.8;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = Math.max(3, w / 140) * (1 - p);
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, p * Math.max(w, h) * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  spotlight: (ctx, w, h, t) => {
    const pulse = 0.22 + 0.02 * Math.sin(t * Math.PI);
    const g = ctx.createRadialGradient(
      w / 2, h * 0.45, Math.min(w, h) * pulse,
      w / 2, h * 0.45, Math.max(w, h) * 0.72
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.72)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  goldrain: (ctx, w, h, t) => {
    for (let i = 0; i < 24; i++) {
      const dur = 1.8 + rand(i + 6);
      const p = ((t + i * 0.1) % dur) / dur;
      const x = rand(i + 21) * w;
      const y = p * h * 1.05;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p * Math.PI * 3);
      ctx.fillStyle = i % 2 ? "#facc15" : "#f59e0b";
      const s = Math.max(6, w / 80);
      ctx.beginPath();
      ctx.ellipse(0, 0, s / 2, s / 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
  matrix: (ctx, w, h, t) => {
    const cols = 16;
    const fs = Math.max(10, Math.round(h * 0.028));
    ctx.font = `${fs}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < cols; i++) {
      const dur = 2 + rand(i) * 2;
      const p = ((t + i * 0.17) % dur) / dur;
      const x = (i / cols) * w + w / (cols * 2);
      const head = p * h * 1.1;
      for (let k = 0; k < 8; k++) {
        const y = head - k * fs * 1.2;
        if (y < 0 || y > h) continue;
        ctx.globalAlpha = Math.max(0, 1 - k / 8);
        ctx.fillStyle = k === 0 ? "#bbf7d0" : "#22c55e";
        ctx.fillText(rand(i + k + Math.floor(t * 8)) > 0.5 ? "1" : "0", x, y);
      }
    }
    ctx.globalAlpha = 1;
  },
};


function drawBadge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  text: string,
  bg: string,
  align: "left" | "right"
) {
  const fs = Math.max(12, Math.round(h * 0.035));
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const padding = fs * 0.5;
  const tw = ctx.measureText(text).width;
  const x = align === "left" ? h * 0.02 : w - tw - padding * 2 - h * 0.02;
  const y = h * 0.02;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, tw + padding * 2, fs + padding);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x + padding, y + padding / 2);
}

export interface BakePin {
  x: number; // 0-100 %
  y: number; // 0-100 %
  emoji: string;
  animation: string;
  isObject?: boolean;
}

const PIN_AURA_COLORS: Record<string, string> = {
  "fire-aura": "249,115,22",
  glow: "139,92,246",
  ice: "103,232,249",
  smoke: "156,163,175",
  rainbow: "236,72,153",
  portal: "168,85,247",
  electric: "34,211,238",
  lightning: "250,204,21",
  shockwave: "59,130,246",
  "speed-lines": "255,255,255",
  comet: "251,191,36",
  "hoop-fire": "239,68,68",
  sparkle: "245,158,11",
  // PRO auras
  inferno: "220,38,38",
  "neon-trail": "16,185,129",
  "shadow-clone": "30,41,59",
  galaxy: "129,140,248",
  matrix: "34,197,94",
  "gold-aura": "234,179,8",
  "toxic-glow": "132,204,22",
  "frost-nova": "56,189,248",
  "sonic-boom": "244,114,182",
  "confetti-burst": "251,146,60",
  plasma: "168,85,247",
  "thunder-crown": "250,204,21",
  afterimage: "148,163,184",
  "lava-steps": "234,88,12",
  "bubble-trail": "56,189,248",
  "wind-tunnel": "203,213,225",
  "star-shower": "250,232,255",
  hologram: "34,211,238",
  "blood-moon": "185,28,28",
  "diamond-dust": "191,219,254",
};

const drawPin = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  pin: BakePin
) => {
  const cx = (pin.x / 100) * w;
  const cy = (pin.y / 100) * h;
  const size = Math.max(28, h * (pin.isObject ? 0.12 : 0.1));
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * Math.PI));
  const color = PIN_AURA_COLORS[pin.animation];

  if (color && pin.animation !== "none") {
    const r = size * 1.4 * pulse;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${color},0.65)`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (pin.animation === "shockwave" || pin.animation === "electric" || pin.animation === "sonic-boom" || pin.animation === "frost-nova") {
    ctx.strokeStyle = `rgba(${color ?? "255,255,255"},${1 - (t % 1)})`;
    ctx.lineWidth = Math.max(2, w / 250);
    ctx.beginPath();
    ctx.arc(cx, cy, size * (0.8 + (t % 1) * 1.2), 0, Math.PI * 2);
    ctx.stroke();
  }

  if (pin.animation === "shadow-clone") {
    ctx.globalAlpha = 0.35;
    ctx.font = `${Math.round(size)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pin.emoji, cx - size * 0.5, cy);
    ctx.fillText(pin.emoji, cx + size * 0.5, cy);
    ctx.globalAlpha = 1;
  }


  ctx.font = `${Math.round(size)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pin.emoji, cx, cy);

  if (pin.animation === "sparkle") {
    ctx.font = `${Math.round(size * 0.5)}px serif`;
    ctx.globalAlpha = pulse;
    ctx.fillText("✨", cx + size * 0.6, cy - size * 0.6);
    ctx.fillText("✨", cx - size * 0.6, cy + size * 0.6);
    ctx.globalAlpha = 1;
  }
  if (pin.animation === "lightning") {
    ctx.font = `${Math.round(size * 0.7)}px serif`;
    ctx.globalAlpha = pulse;
    ctx.fillText("⚡", cx, cy - size * 0.9);
    ctx.globalAlpha = 1;
  }

  const PRO_ACCENTS: Record<string, string> = {
    inferno: "🔥",
    "neon-trail": "🟢",
    galaxy: "🌌",
    matrix: "🟩",
    "gold-aura": "✨",
    "toxic-glow": "☢️",
    "confetti-burst": "🎉",
    plasma: "🟣",
    "thunder-crown": "⚡",
    afterimage: "🎞️",
    "lava-steps": "🌋",
    "bubble-trail": "🫧",
    "wind-tunnel": "🌬️",
    "star-shower": "🌠",
    hologram: "🛰️",
    "blood-moon": "🌑",
    "diamond-dust": "💎",
  };
  const accent = PRO_ACCENTS[pin.animation];
  if (accent) {
    ctx.font = `${Math.round(size * 0.55)}px serif`;
    ctx.globalAlpha = pulse;
    const wobble = Math.sin(t * Math.PI * 2) * size * 0.3;
    ctx.fillText(accent, cx + size * 0.7, cy - size * 0.7 + wobble);
    ctx.fillText(accent, cx - size * 0.7, cy + size * 0.5 - wobble);
    ctx.globalAlpha = 1;
  }
};

export const hasBakeableFx = (
  color: ColorFilterType,
  animated: FilterType,
  pins: BakePin[] = []
) => color !== "none" || (animated !== "none" && !!painters[animated]) || pins.length > 0;

export interface BakeOptions {
  colorFilter: ColorFilterType;
  animatedFilter: FilterType;
  pins?: BakePin[];
  onProgress?: (pct: number) => void;
}

/** Re-encodes the video with the color look + animated overlay burned in. */
export const bakeVideoFx = (
  file: File | Blob,
  { colorFilter, animatedFilter, pins = [], onProgress }: BakeOptions
): Promise<Blob> =>

  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const cleanup = () => URL.revokeObjectURL(url);

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read the selected video."));
    };

    video.onloadedmetadata = () => {
      const w = video.videoWidth || 720;
      const h = video.videoHeight || 1280;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx || typeof MediaRecorder === "undefined") {
        cleanup();
        reject(new Error("Effect rendering is not supported on this device."));
        return;
      }

      const cssFilter = cssFilterFor(colorFilter);
      const painter = painters[animatedFilter];
      const duration = isFinite(video.duration) ? video.duration : 0;

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onerror = () => {
        cleanup();
        reject(new Error("Rendering the effects failed. Try again."));
      };
      recorder.onstop = () => {
        cleanup();
        onProgress?.(100);
        resolve(new Blob(chunks, { type: "video/webm" }));
      };

      let raf = 0;
      const draw = () => {
        if (video.ended || (duration && video.currentTime >= duration - 0.05)) {
          cancelAnimationFrame(raf);
          video.pause();
          if (recorder.state !== "inactive") recorder.stop();
          return;
        }
        ctx.save();
        ctx.filter = cssFilter;
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
        painter?.(ctx, w, h, video.currentTime);
        pins.forEach((p) => drawPin(ctx, w, h, video.currentTime, p));

        if (duration) onProgress?.(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        raf = requestAnimationFrame(draw);
      };

      recorder.start();
      video
        .play()
        .then(() => {
          raf = requestAnimationFrame(draw);
        })
        .catch(() => {
          cleanup();
          reject(new Error("Could not play the clip to render effects."));
        });
    };
  });
