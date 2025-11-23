import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface MatchPair {
  athlete: string;
  sport: string;
  fact: string;
  options: string[];
}

const matchPairs: MatchPair[] = [
  {
    athlete: "Michael Jordan",
    sport: "Basketball",
    fact: "Won 6 NBA Championships with the Chicago Bulls and is considered by many as the greatest basketball player of all time.",
    options: ["Basketball", "Baseball", "Football", "Soccer"]
  },
  {
    athlete: "Serena Williams",
    sport: "Tennis",
    fact: "Has won 23 Grand Slam singles titles, the most by any player in the Open Era.",
    options: ["Tennis", "Badminton", "Volleyball", "Table Tennis"]
  },
  {
    athlete: "Usain Bolt",
    sport: "Athletics",
    fact: "The fastest man in history, holding world records in both 100m and 200m sprints.",
    options: ["Athletics", "Swimming", "Cycling", "Boxing"]
  },
  {
    athlete: "Lionel Messi",
    sport: "Soccer",
    fact: "Won 8 Ballon d'Or awards and led Argentina to World Cup victory in 2022.",
    options: ["Soccer", "Rugby", "Hockey", "Cricket"]
  },
  {
    athlete: "Michael Phelps",
    sport: "Swimming",
    fact: "The most decorated Olympian of all time with 28 Olympic medals, 23 of them gold.",
    options: ["Swimming", "Diving", "Water Polo", "Rowing"]
  },
  {
    athlete: "Tiger Woods",
    sport: "Golf",
    fact: "Won 15 major championships and revolutionized the sport of golf.",
    options: ["Golf", "Tennis", "Bowling", "Snooker"]
  },
  {
    athlete: "Muhammad Ali",
    sport: "Boxing",
    fact: "Three-time world heavyweight champion and one of the most significant sports figures of the 20th century.",
    options: ["Boxing", "Wrestling", "MMA", "Kickboxing"]
  },
  {
    athlete: "Simone Biles",
    sport: "Gymnastics",
    fact: "Most decorated gymnast in World Championships history with 25 medals.",
    options: ["Gymnastics", "Figure Skating", "Diving", "Dance"]
  },
];

interface Props {
  onBack: () => void;
}

const AthleteMatch = ({ onBack }: Props) => {
  const [currentPair, setCurrentPair] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const pair = matchPairs[currentPair];
  const progress = ((currentPair + 1) / matchPairs.length) * 100;

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);

    if (answer === pair.sport) {
      setScore(score + 1);
      toast.success("Perfect match! 🎉");
    } else {
      toast.error("Not the right sport!");
    }
  };

  const nextPair = () => {
    if (currentPair < matchPairs.length - 1) {
      setCurrentPair(currentPair + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameFinished(true);
    }
  };

  const resetGame = () => {
    setCurrentPair(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameFinished(false);
  };

  if (gameFinished) {
    const percentage = (score / matchPairs.length) * 100;
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <Card className="glass-effect max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-display">Game Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold gradient-text">{score}/{matchPairs.length}</p>
              <p className="text-lg text-muted-foreground">
                {percentage >= 80 ? "Sports legend! 🌟" : percentage >= 60 ? "Great matching! 👏" : "Keep learning! 💪"}
              </p>
            </div>

            <Progress value={percentage} className="h-3" />

            <div className="flex gap-3">
              <Button onClick={resetGame} className="flex-1">
                Play Again
              </Button>
              <Button onClick={onBack} variant="outline" className="flex-1">
                Choose Another Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Games
      </Button>

      <Card className="glass-effect max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle className="text-2xl font-display">Athlete Match</CardTitle>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-bold">{score} / {currentPair}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Athlete {currentPair + 1} of {matchPairs.length}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2 py-6">
            <h3 className="text-3xl font-bold gradient-text mb-4">
              {pair.athlete}
            </h3>
            <p className="text-lg font-medium text-foreground">
              Which sport did this legend compete in?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {pair.options.map((option) => (
              <Button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                variant="outline"
                className={`h-auto py-6 text-lg ${
                  selectedAnswer === null 
                    ? "hover:bg-primary/10" 
                    : option === pair.sport
                    ? "bg-green-500/20 border-green-500"
                    : selectedAnswer === option
                    ? "bg-red-500/20 border-red-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-center gap-2 w-full">
                  {showResult && option === pair.sport && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {showResult && selectedAnswer === option && option !== pair.sport && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span>{option}</span>
                </div>
              </Button>
            ))}
          </div>

          {showResult && (
            <div className="p-4 bg-muted/50 rounded-lg animate-fade-in">
              <p className="text-sm font-medium mb-2">Did you know?</p>
              <p className="text-sm text-muted-foreground">{pair.fact}</p>
            </div>
          )}

          {showResult && (
            <Button onClick={nextPair} className="w-full mt-4">
              {currentPair < matchPairs.length - 1 ? "Next Athlete" : "Finish"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AthleteMatch;
