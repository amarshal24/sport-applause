import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProBadgeProps {
  className?: string;
  label?: string;
}

/** Shown next to a member's name once they own Pro FX access. */
export const ProBadge = ({ className, label = "PRO" }: ProBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm",
      className
    )}
    title="Pro FX member"
  >
    <Crown className="h-3 w-3" />
    {label}
  </span>
);
