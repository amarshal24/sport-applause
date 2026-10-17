import { Check, Crown, Lock, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GAME_PACKAGES } from "@/constants/gamePackages";
import { cn } from "@/lib/utils";

const icons = { rookie: Zap, all_star: Trophy, mvp: Crown };

const GamePackages = () => (
  <section className="mb-8" aria-labelledby="game-packages-title">
    <div className="mb-4 text-center">
      <h2 id="game-packages-title" className="text-2xl font-display font-bold">Game packages</h2>
      <p className="text-sm text-muted-foreground">Start free. Paid passes are coming soon.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {GAME_PACKAGES.map((pkg) => {
        const Icon = icons[pkg.id];
        const paid = pkg.priceCents > 0;
        return (
          <Card key={pkg.id} className={cn("glass-effect flex flex-col", pkg.id === "mvp" && "border-secondary/70 shadow-orange")}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <Icon className={cn("h-7 w-7", paid ? "text-secondary" : "text-primary")} />
                <Badge variant={pkg.status === "available" ? "default" : "secondary"}>
                  {pkg.status === "available" ? "Included" : "Coming soon"}
                </Badge>
              </div>
              <CardTitle className="font-display text-xl">{pkg.name}</CardTitle>
              <p className="text-3xl font-bold">{pkg.priceLabel}</p>
              <CardDescription>{pkg.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <ul className="flex-1 space-y-2">
                {pkg.includes.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              {paid ? (
                <Button disabled variant="outline" className="w-full"><Lock /> Not available yet</Button>
              ) : (
                <Button asChild className="w-full"><a href="#games-library">Play free games</a></Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  </section>
);

export default GamePackages;