import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PinDragPadProps {
  x: number;
  y: number;
  emoji: string;
  /** Called continuously while dragging with clamped percent coordinates. */
  onChange: (x: number, y: number) => void;
  className?: string;
}

/** Tiny 16:9 pad for nudging a pin's position with drag & drop. */
export const PinDragPad = ({ x, y, emoji, onChange, className }: PinDragPadProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const emit = (clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = ((clientX - rect.left) / rect.width) * 100;
    const ny = ((clientY - rect.top) / rect.height) * 100;
    onChange(
      Math.max(0, Math.min(100, Number(nx.toFixed(2)))),
      Math.max(0, Math.min(100, Number(ny.toFixed(2))))
    );
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full aspect-video rounded-md border border-dashed border-border bg-muted/40 touch-none",
        dragging && "border-primary",
        className
      )}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setDragging(true);
        emit(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => dragging && emit(e.clientX, e.clientY)}
      onPointerUp={(e) => {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        setDragging(false);
      }}
      onPointerCancel={() => setDragging(false)}
    >
      <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground pointer-events-none">
        drag to fine-tune
      </span>
      <span
        className="absolute text-lg pointer-events-none drop-shadow"
        style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
      >
        {emoji}
      </span>
      <span className="absolute bottom-0.5 right-1 text-[9px] tabular-nums text-muted-foreground pointer-events-none">
        {Math.round(x)}% · {Math.round(y)}%
      </span>
    </div>
  );
};
