import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Crown, X, Check, Sparkles, Palette, User, Wand2 } from "lucide-react";
import {
  COLOR_FILTERS,
  SPORT_ANIMATIONS,
  SPORT_CATEGORIES,
  TRANSFORMS,
  TRANSFORM_CATEGORIES,
  type FxTier,
  type SportAnimationItem,
  type TransformItem,
} from "@/constants/videoFx";
import {
  CharacterPinsPanel,
  type CharacterPin,
} from "@/components/video-fx/CharacterPins";
import { UpgradeProModal } from "@/components/video-fx/UpgradeProModal";
import { usePremium } from "@/hooks/usePremium";

// ----- Selection state shape -----
export interface FxSelection {
  colorFilterId: string;        // id from COLOR_FILTERS
  sportAnimationId: string | null;
  transformId: string | null;
}

interface PanelProps {
  open: boolean;
  onClose: () => void;
  selection: FxSelection;
  onChange: (next: FxSelection) => void;

  // Character pins (existing functionality reused)
  pins: CharacterPin[];
  onAddPin: () => void;
  onUpdatePin: (id: string, patch: Partial<CharacterPin>) => void;
  onRemovePin: (id: string) => void;
}

// ----- FREE / PRO badge -----
const TierBadge = ({ tier }: { tier: FxTier }) =>
  tier === "pro" ? (
    <Badge className="absolute right-1 top-1 gap-0.5 bg-gradient-to-r from-primary to-accent px-1.5 py-0 text-[9px] font-bold text-primary-foreground">
      <Crown className="h-2.5 w-2.5" />
      PRO
    </Badge>
  ) : (
    <Badge variant="secondary" className="absolute right-1 top-1 px-1.5 py-0 text-[9px] font-bold">
      FREE
    </Badge>
  );

// ----- Generic FX chip card -----
interface ChipCardProps {
  label: string;
  emoji?: string;
  preview?: React.ReactNode;
  tier: FxTier;
  selected: boolean;
  locked: boolean;
  onClick: () => void;
}

const ChipCard = ({ label, emoji, preview, tier, selected, locked, onClick }: ChipCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "relative flex flex-col items-center gap-1 rounded-xl border-2 bg-card p-2 transition-all",
      "hover:border-primary/60 active:scale-95",
      selected ? "border-primary ring-2 ring-primary/30" : "border-border",
      locked && "opacity-90"
    )}
  >
    <TierBadge tier={tier} />
    <div className="flex h-14 w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
      {preview ?? <span className="text-3xl">{emoji}</span>}
    </div>
    <span className="line-clamp-1 w-full text-center text-[11px] font-medium">{label}</span>
    {selected && (
      <div className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-3 w-3" />
      </div>
    )}
  </button>
);

// ----- Category chip strip -----
interface CategoryChipsProps<T extends string> {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}

function CategoryChips<T extends string>({ options, value, onChange }: CategoryChipsProps<T>) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              value === o.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

export const FullscreenFiltersEffectsPanel = ({
  open,
  onClose,
  selection,
  onChange,
  pins,
  onAddPin,
  onUpdatePin,
  onRemovePin,
}: PanelProps) => {
  const { isPremium, upgradeOpen, requestUpgrade, closeUpgrade } = usePremium();

  const [mainTab, setMainTab] = useState<"filters" | "effects">("filters");
  const [filtersSubTab, setFiltersSubTab] = useState<"color" | "sport">("color");
  const [effectsSubTab, setEffectsSubTab] = useState<"characters" | "transforms">("characters");

  const [sportCategory, setSportCategory] = useState<typeof SPORT_CATEGORIES[number]["id"]>("all");
  const [transformCategory, setTransformCategory] =
    useState<typeof TRANSFORM_CATEGORIES[number]["id"]>("all");

  const filteredSportAnimations = useMemo(
    () =>
      sportCategory === "all"
        ? SPORT_ANIMATIONS
        : SPORT_ANIMATIONS.filter((a) => a.sport === sportCategory),
    [sportCategory]
  );

  const filteredTransforms = useMemo(
    () =>
      transformCategory === "all"
        ? TRANSFORMS
        : TRANSFORMS.filter((t) => t.category === transformCategory),
    [transformCategory]
  );

  const handleSelectColor = (id: string) => onChange({ ...selection, colorFilterId: id });

  const handleSelectSportAnim = (item: SportAnimationItem) => {
    if (item.tier === "pro" && !isPremium) {
      requestUpgrade();
      return;
    }
    onChange({
      ...selection,
      sportAnimationId: selection.sportAnimationId === item.id ? null : item.id,
    });
  };

  const handleSelectTransform = (item: TransformItem) => {
    if (item.tier === "pro" && !isPremium) {
      requestUpgrade();
      return;
    }
    onChange({
      ...selection,
      transformId: selection.transformId === item.id ? null : item.id,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-background p-0 sm:max-w-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Wand2 className="h-5 w-5 text-primary" />
              Filters & Effects
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Main tabs */}
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "filters" | "effects")} className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
              <TabsTrigger value="filters" className="gap-2">
                <Palette className="h-4 w-4" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="effects" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Effects
              </TabsTrigger>
            </TabsList>

            {/* ======= FILTERS TAB ======= */}
            <TabsContent value="filters" className="flex-1 overflow-hidden px-4 pt-3">
              <Tabs
                value={filtersSubTab}
                onValueChange={(v) => setFiltersSubTab(v as "color" | "sport")}
                className="flex h-full flex-col"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="color">Color</TabsTrigger>
                  <TabsTrigger value="sport">Sport Animations</TabsTrigger>
                </TabsList>

                {/* --- Color sub-tab --- */}
                <TabsContent value="color" className="mt-3 flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="grid grid-cols-3 gap-3 pb-6 sm:grid-cols-4 md:grid-cols-6">
                      {COLOR_FILTERS.map((f) => (
                        <ChipCard
                          key={f.id}
                          label={f.label}
                          tier={f.tier}
                          selected={selection.colorFilterId === f.id}
                          locked={false}
                          onClick={() => handleSelectColor(f.id)}
                          preview={
                            <div
                              className="h-full w-full bg-gradient-to-br from-primary/40 via-accent/30 to-secondary/40"
                              style={{ filter: f.css === "none" ? undefined : f.css }}
                            />
                          }
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* --- Sport Animations sub-tab --- */}
                <TabsContent value="sport" className="mt-3 flex flex-1 flex-col overflow-hidden">
                  <CategoryChips
                    options={SPORT_CATEGORIES}
                    value={sportCategory}
                    onChange={(v) => setSportCategory(v as typeof sportCategory)}
                  />
                  <ScrollArea className="mt-1 flex-1 pr-2">
                    <div className="grid grid-cols-3 gap-3 pb-6 sm:grid-cols-4 md:grid-cols-6">
                      {filteredSportAnimations.map((a) => (
                        <ChipCard
                          key={a.id}
                          label={a.label}
                          emoji={a.emoji}
                          tier={a.tier}
                          selected={selection.sportAnimationId === a.id}
                          locked={a.tier === "pro" && !isPremium}
                          onClick={() => handleSelectSportAnim(a)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ======= EFFECTS TAB ======= */}
            <TabsContent value="effects" className="flex-1 overflow-hidden px-4 pt-3">
              <Tabs
                value={effectsSubTab}
                onValueChange={(v) => setEffectsSubTab(v as "characters" | "transforms")}
                className="flex h-full flex-col"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="characters" className="gap-2">
                    <User className="h-4 w-4" />
                    Characters
                  </TabsTrigger>
                  <TabsTrigger value="transforms" className="gap-2">
                    <Wand2 className="h-4 w-4" />
                    Transforms
                  </TabsTrigger>
                </TabsList>

                {/* --- Characters sub-tab (reuses existing pins component) --- */}
                <TabsContent value="characters" className="mt-3 flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="pb-6">
                      <CharacterPinsPanel
                        pins={pins}
                        onAdd={onAddPin}
                        onUpdate={onUpdatePin}
                        onRemove={onRemovePin}
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* --- Transforms sub-tab --- */}
                <TabsContent value="transforms" className="mt-3 flex flex-1 flex-col overflow-hidden">
                  <CategoryChips
                    options={TRANSFORM_CATEGORIES}
                    value={transformCategory}
                    onChange={(v) => setTransformCategory(v as typeof transformCategory)}
                  />
                  <ScrollArea className="mt-1 flex-1 pr-2">
                    <div className="grid grid-cols-3 gap-3 pb-6 sm:grid-cols-4 md:grid-cols-6">
                      {filteredTransforms.map((t) => (
                        <ChipCard
                          key={t.id}
                          label={t.label}
                          emoji={t.emoji}
                          tier={t.tier}
                          selected={selection.transformId === t.id}
                          locked={t.tier === "pro" && !isPremium}
                          onClick={() => handleSelectTransform(t)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Tap a <span className="font-semibold text-foreground">PRO</span> item to upgrade.
            </p>
            <Button onClick={onClose} size="sm">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeProModal open={upgradeOpen} onClose={closeUpgrade} />
    </>
  );
};

export const defaultFxSelection: FxSelection = {
  colorFilterId: "original",
  sportAnimationId: null,
  transformId: null,
};
