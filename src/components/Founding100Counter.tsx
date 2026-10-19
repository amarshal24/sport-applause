import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FOUNDING100_CAP, remainingSpots } from "@/lib/founding100";

export default function Founding100Counter({ className = "" }: { className?: string }) {
  const [selected, setSelected] = useState<number>();
  useEffect(() => {
    let alive = true;
    supabase.rpc("founding100_approved_count").then(({ data, error }) => {
      if (alive && !error && typeof data === "number") setSelected(data);
    });
    return () => { alive = false; };
  }, []);
  if (selected === undefined) return null;
  return (
    <p className={className} role="status">
      <span className="font-display text-2xl text-secondary">{selected}</span>
      <span className="text-muted-foreground"> / {FOUNDING100_CAP} founding spots approved · {remainingSpots(selected)} remaining</span>
    </p>
  );
}
