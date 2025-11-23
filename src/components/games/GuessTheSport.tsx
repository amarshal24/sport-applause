import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  emojis: string;
  hint: string;
  answer: string;
  options: string[];
}

const challenges: Challenge[] = [
  {
    emojis: "⚽🥅",
    hint: "The world's most popular sport",
    answer: "Soccer",
    options: ["Soccer", "Basketball", "Hockey", "Rugby"]
  },
  {
    emojis: "🏀🔥",
    hint: "Slam dunks and three-pointers",
    answer: "Basketball",
    options: ["Volleyball", "Basketball", "Handball", "Tennis"]
  },
  {
    emojis: "🎾💚",
    hint: "Love means zero in this game",
    answer: "Tennis",
    options: ["Badminton", "Tennis", "Squash", "Pickleball"]
  },
  {
    emojis: "🏊‍♂️💦",
    hint: "Make a splash in the pool",
    answer: "Swimming",
    options: ["Diving", "Swimming", "Water Polo", "Surfing"]
  },
  {
    emojis: "🏈🏟️",
    hint: "Touchdowns and field goals",
    answer: "American Football",
    options: ["Rugby", "American Football", "Soccer", "Australian Football"]
  },
  {
    emojis: "🏏🇮🇳",
    hint: "Popular in India and England",
    answer: "Cricket",
    options: ["Baseball", "Cricket", "Polo", "Field Hockey"]
  },
  {
    emojis: "⛳🏌️",
    hint: "18 holes to conquer",
    answer: "Golf",
    options: ["Mini Golf", "Golf", "Disc Golf", "Croquet"]
  },
  {
    emojis: "🥊👊",
    hint: "Float like a butterfly",
    answer: "Boxing",
    options: ["MMA", "Boxing", "Kickboxing", "Wrestling"]
  },
];

interface Props {
  onBack: () => void;
}

const GuessTheSport = ({ onBack }: Props) => {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const challenge = challenges[currentChallenge];
  const progress = ((currentChallenge + 1) / challenges.length) * 100;

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);

    if (answer === challenge.answer) {
      setScore(score + 1);
      toast.success("Correct! 🎉");
    } else {
      toast.error("Not quite!");
    }
  };

  const nextChallenge = () => {
    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameFinished(true);
    }
  };

  const resetGame = () => {
    setCurrentChallenge(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameFinished(false);
  };

  if (gameFinished) {
    const percentage = (score / challenges.length) * 100;
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <Card className="glass-effect max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-display">Challenge Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold gradient-text">{score}/{challenges.length}</p>
              <p className="text-lg text-muted-foreground">
                {percentage >= 80 ? "Sport genius! 🌟" : percentage >= 60 ? "Well done! 👏" : "Keep guessing! 💪"}
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
            <CardTitle className="text-2xl font-display">Guess the Sport</CardTitle>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-bold">{score} / {currentChallenge}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Challenge {currentChallenge + 1} of {challenges.length}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-4 py-8">
            <div className="text-7xl mb-4 animate-pulse-glow">
              {challenge.emojis}
            </div>
            <p className="text-lg text-muted-foreground italic">
              💡 {challenge.hint}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {challenge.options.map((option) => (
              <Button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                variant="outline"
                className={`h-auto py-6 text-lg ${
                  selectedAnswer === null 
                    ? "hover:bg-primary/10" 
                    : option === challenge.answer
                    ? "bg-green-500/20 border-green-500"
                    : selectedAnswer === option
                    ? "bg-red-500/20 border-red-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-center gap-2 w-full">
                  {showResult && option === challenge.answer && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {showResult && selectedAnswer === option && option !== challenge.answer && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span>{option}</span>
                </div>
              </Button>
            ))}
          </div>

          {showResult && (
            <Button onClick={nextChallenge} className="w-full mt-4">
              {currentChallenge < challenges.length - 1 ? "Next Challenge" : "Finish"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuessTheSport;
