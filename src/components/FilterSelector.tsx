import { Button } from "@/components/ui/button";
import { Sparkles, Flame, PartyPopper, Zap, Trophy } from "lucide-react";
import { FilterType } from "./AnimatedFilters";

interface FilterSelectorProps {
  selectedFilter: FilterType;
  onFilterSelect: (filter: FilterType) => void;
}

const FILTERS = [
  { id: "none" as FilterType, label: "None", icon: null },
  { id: "sparkle" as FilterType, label: "Sparkle", icon: Sparkles },
  { id: "fire" as FilterType, label: "Fire", icon: Flame },
  { id: "confetti" as FilterType, label: "Confetti", icon: PartyPopper },
  { id: "glow" as FilterType, label: "Glow", icon: Zap },
  { id: "victory" as FilterType, label: "Victory", icon: Trophy }
];

export const FilterSelector = ({ selectedFilter, onFilterSelect }: FilterSelectorProps) => {
  return (
    <div className="flex gap-2 flex-wrap mb-6">
      <span className="text-sm text-muted-foreground self-center mr-2">Filters:</span>
      {FILTERS.map((filter) => {
        const Icon = filter.icon;
        return (
          <Button
            key={filter.id}
            onClick={() => onFilterSelect(filter.id)}
            variant={selectedFilter === filter.id ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {Icon && <Icon className="w-4 h-4" />}
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
};
