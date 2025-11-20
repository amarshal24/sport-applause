import { 
  Dumbbell, 
  Trophy, 
  Bike, 
  Waves, 
  Zap,
  Target,
  Wind,
  Mountain,
  Globe,
  Volleyball,
  LucideIcon
} from "lucide-react";

export interface Sport {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const SPORTS: Sport[] = [
  { id: "basketball", name: "Basketball", icon: Trophy },
  { id: "football", name: "Football", icon: Target },
  { id: "soccer", name: "Soccer", icon: Globe },
  { id: "tennis", name: "Tennis", icon: Zap },
  { id: "volleyball", name: "Volleyball", icon: Volleyball },
  { id: "baseball", name: "Baseball", icon: Target },
  { id: "swimming", name: "Swimming", icon: Waves },
  { id: "running", name: "Running", icon: Wind },
  { id: "cycling", name: "Cycling", icon: Bike },
  { id: "gym", name: "Gym/Fitness", icon: Dumbbell },
  { id: "hiking", name: "Hiking", icon: Mountain },
  { id: "other", name: "Other", icon: Trophy },
];

export const getSportIcon = (sportId: string): LucideIcon => {
  const sport = SPORTS.find(s => s.id === sportId);
  return sport?.icon || Trophy;
};

export const getSportName = (sportId: string): string => {
  const sport = SPORTS.find(s => s.id === sportId);
  return sport?.name || "Sport";
};
