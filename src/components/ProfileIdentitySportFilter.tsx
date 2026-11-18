import { Button } from "@/components/ui/button";
import { SPORTS } from "@/constants/sports";

interface Props {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

export default function ProfileIdentitySportFilter({ value, onChange, compact = false }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Profile identity sport</p>
      <div role="group" aria-label="Profile identity sport" className={compact ? "flex gap-2 overflow-x-auto pb-1" : "flex flex-wrap gap-2"}>
        {[{ id: "mine", name: "My sports" }, { id: "all", name: "All Sports" }, ...SPORTS].map(sport => (
          <Button key={sport.id} size="sm" variant={value === sport.id ? "default" : "outline"}
            aria-pressed={value === sport.id} className="shrink-0 gap-2" onClick={() => onChange(sport.id)}>
            {"icon" in sport && <sport.icon className="h-4 w-4" aria-hidden />}{sport.name}
          </Button>
        ))}
      </div>
    </div>
  );
}