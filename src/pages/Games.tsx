import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Trophy, Timer, Target, Zap, Medal } from "lucide-react";
import { useState } from "react";
import SportsTrivia from "@/components/games/SportsTrivia";
import GuessTheSport from "@/components/games/GuessTheSport";
import AthleteMatch from "@/components/games/AthleteMatch";

const Games = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: "trivia",
      title: "Sports Trivia Challenge",
      description: "Test your sports knowledge with rapid-fire questions",
      icon: Brain,
      color: "from-blue-500 to-cyan-500",
      component: SportsTrivia,
    },
    {
      id: "guess-sport",
      title: "Guess the Sport",
      description: "Identify sports from emojis and clues",
      icon: Target,
      color: "from-purple-500 to-pink-500",
      component: GuessTheSport,
    },
    {
      id: "athlete-match",
      title: "Athlete Match",
      description: "Match legendary athletes to their sports",
      icon: Medal,
      color: "from-orange-500 to-red-500",
      component: AthleteMatch,
    },
  ];

  const ActiveGame = selectedGame ? games.find(g => g.id === selectedGame)?.component : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {!selectedGame ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-display font-bold gradient-text mb-3 animate-fade-in">
                  Sports Game Zone ⚡️
                </h1>
                <p className="text-muted-foreground text-lg">
                  Learn, compete, and master your sports knowledge
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
                          <span>Interactive & Educational</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-12 glass-effect p-6 rounded-xl">
                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  Why Play?
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Learn Sports History</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover fascinating facts about legendary athletes and iconic moments
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Timer className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Quick & Fun</h3>
                    <p className="text-sm text-muted-foreground">
                      Perfect for short breaks - each game takes just a few minutes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Medal className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Track Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Challenge yourself and improve your score with every play
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
