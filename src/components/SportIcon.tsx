import { getSportIcon } from "@/constants/sports";
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
