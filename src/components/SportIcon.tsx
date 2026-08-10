import { getSportIcon, getSportName } from "@/constants/sports";
import { cn } from "@/lib/utils";

interface SportIconProps {
  sportId: string;
  className?: string;
}

export const SportIcon = ({ sportId, className }: SportIconProps) => {
  const Icon = getSportIcon(sportId);
  
  return (
    <div className={cn(
      "absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background",
      className
    )}>
      <Icon className="w-3 h-3" />
    </div>
  );
};

interface InlineSportIconProps {
  sportId: string;
  className?: string;
}

/** Small sport badge rendered inline next to a user's name. */
export const InlineSportIcon = ({ sportId, className }: InlineSportIconProps) => {
  const Icon = getSportIcon(sportId);

  return (
    <span
      title={getSportName(sportId)}
      aria-label={getSportName(sportId)}
      className={cn(
        "inline-flex items-center justify-center shrink-0 rounded-full bg-primary/15 text-primary p-1",
        className
      )}
    >
      <Icon className="w-3 h-3" />
    </span>
  );
};
