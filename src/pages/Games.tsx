import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Trophy, Timer, Target, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import SportsTrivia from "@/components/games/SportsTrivia";
import GuessTheSport from "@/components/games/GuessTheSport";
import SportsAnimator from "@/components/games/SportsAnimator";

const Games = () => {
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: "trivia",
      title: t("games.sportsTrivia"),
      description: t("games.triviaDesc"),
      icon: Brain,
      color: "from-blue-500 to-cyan-500",
      component: SportsTrivia,
    },
    {
      id: "guess-sport",
      title: t("games.guessTheSport"),
      description: t("games.guessDesc"),
      icon: Target,
      color: "from-purple-500 to-pink-500",
      component: GuessTheSport,
    },
    {
      id: "sports-animator",
      title: t("games.sportsAnimator"),
      description: t("games.animatorDesc"),
      icon: Sparkles,
      color: "from-pink-500 to-purple-500",
      component: SportsAnimator,
    },
  ];

  const ActiveGame = selectedGame ? games.find(g => g.id === selectedGame)?.component : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6">
          {!selectedGame ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-display font-bold gradient-text mb-3 animate-fade-in">
                  {t("games.title")} ⚡️
                </h1>
                <p className="text-muted-foreground text-lg">
                  {t("games.subtitle")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => {
                  const Icon = game.icon;
                  return (
                    <Card 
                      key={game.id}
                      className="glass-effect hover:shadow-glow transition-all duration-300 cursor-pointer group animate-fade-in"
                      onClick={() => setSelectedGame(game.id)}
                    >
                      <CardHeader>
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-xl font-display">{game.title}</CardTitle>
                        <CardDescription className="text-base">
                          {game.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="w-4 h-4 text-primary" />
                          <span>{t("games.playNow")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-12 glass-effect p-6 rounded-xl">
                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  {t("games.title")}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{t("games.sportsTrivia")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("games.triviaDesc")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Timer className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{t("games.guessTheSport")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("games.guessDesc")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{t("games.sportsAnimator")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("games.animatorDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            ActiveGame && <ActiveGame onBack={() => setSelectedGame(null)} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Games;
