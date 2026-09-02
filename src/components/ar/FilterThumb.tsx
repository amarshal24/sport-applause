import { useEffect, useRef } from "react";
import type { FilterDef } from "@/lib/filters/filterRenderer";
import type { AnchorTransform, TrackedTarget } from "@/lib/ar/types";

/**
 * Animated preview thumbnail for a filter.
 * The animation runs on a rAF loop against refs — never React state.
 */
const SIZE = 72;

const fakeTarget = (): TrackedTarget =>
  ({
    id: 0,
    box: { x: 0.2, y: 0.1, w: 0.6, h: 0.8 },
    center: { x: 0.5, y: 0.5 },
    scale: 1,
    rotation: 0,
    velocity: { x: 0.08, y: 0 },
    confidence: 1,
    coasting: false,
    lastSeen: 0,
    depth: 0,
  }) as unknown as TrackedTarget;

const drawMannequin = (ctx: CanvasRenderingContext2D, filter: FilterDef) => {
  const s = filter.skin;
  const body = s?.suit ?? "hsl(215 25% 42%)";
  const head = s?.skin ?? "hsl(30 40% 70%)";
  const accent = s?.accent ?? "hsl(24 95% 55%)";
  ctx.save();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(SIZE * 0.36, SIZE * 0.42, SIZE * 0.28, SIZE * 0.36, SIZE * 0.08);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(SIZE * 0.36, SIZE * 0.54, SIZE * 0.28, SIZE * 0.05);
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(SIZE * 0.5, SIZE * 0.32, SIZE * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const FilterThumb = ({ filter }: { filter: FilterDef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const target = fakeTarget();
    let raf = 0;

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      const f = filterRef.current;
      ctx.clearRect(0, 0, SIZE, SIZE);
      drawMannequin(ctx, f);
      if (!f.draw) return;
      const t: AnchorTransform = {
        x: SIZE * 0.5,
        y: f.anchor === "head" || f.anchor === "forehead" ? SIZE * 0.3 : f.anchor === "eyes" ? SIZE * 0.31 : SIZE * 0.56,
        width: f.anchor === "eyes" ? SIZE * 0.3 : SIZE * 0.34,
        height: f.anchor === "eyes" ? SIZE * 0.09 : SIZE * 0.3,
        rotation: 0,
        alpha: 1,
        depth: 0,
      };
      try {
        f.draw(ctx, t, target, time);
      } catch {
        /* preview only */
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE }}
      className="h-[52px] w-[52px] rounded-lg bg-black/40"
      aria-hidden
    />
  );
};

export default FilterThumb;
