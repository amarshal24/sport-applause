import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const triviaQuestions: Question[] = [
  {
    question: "Which country won the first FIFA World Cup in 1930?",
    options: ["Brazil", "Argentina", "Uruguay", "Italy"],
    correct: 2,
    explanation: "Uruguay hosted and won the inaugural FIFA World Cup in 1930, defeating Argentina 4-2 in the final."
  },
  {
    question: "How many players are on a basketball team on the court?",
    options: ["5", "6", "7", "11"],
    correct: 0,
    explanation: "A basketball team has 5 players on the court at any given time."
  },
  {
    question: "In which sport would you perform a 'slam dunk'?",
    options: ["Volleyball", "Tennis", "Basketball", "Baseball"],
    correct: 2,
    explanation: "A slam dunk is a basketball shot where a player jumps and forcefully puts the ball through the basket."
  },
  {
    question: "What is the maximum break in snooker?",
    options: ["147", "180", "155", "200"],
    correct: 0,
    explanation: "The maximum break in snooker is 147 points, achieved by potting all 15 reds with blacks, followed by all colors."
  },
  {
    question: "How many Grand Slam tournaments are there in tennis?",
    options: ["3", "4", "5", "6"],
    correct: 1,
    explanation: "There are 4 Grand Slam tournaments: Australian Open, French Open, Wimbledon, and US Open."
  },
  {
    question: "In American football, how many points is a touchdown worth?",
    options: ["3", "5", "6", "7"],
    correct: 2,
    explanation: "A touchdown in American football is worth 6 points, with the option to score extra points after."
  },
  {
    question: "Which sport uses the terms 'eagle', 'birdie', and 'bogey'?",
    options: ["Cricket", "Golf", "Badminton", "Tennis"],
    correct: 1,
    explanation: "Golf uses these terms to describe scores: eagle (2 under par), birdie (1 under par), and bogey (1 over par)."
  },
  {
    question: "How long is an Olympic swimming pool in meters?",
    options: ["25m", "50m", "75m", "100m"],
    correct: 1,
    explanation: "An Olympic-size swimming pool is 50 meters long, 25 meters wide, and at least 2 meters deep."
  },
];

interface Props {
  onBack: () => void;
}

const SportsTrivia = ({ onBack }: Props) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const question = triviaQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / triviaQuestions.length) * 100;

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === question.correct) {
      setScore(score + 1);
      toast.success("Correct! 🎉");
    } else {
      toast.error("Incorrect!");
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < triviaQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameFinished(true);
    }
  };

  const resetGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameFinished(false);
  };

  if (gameFinished) {
    const percentage = (score / triviaQuestions.length) * 100;
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <Card className="glass-effect max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-display">Game Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold gradient-text">{score}/{triviaQuestions.length}</p>
              <p className="text-lg text-muted-foreground">
                {percentage >= 80 ? "Outstanding! 🌟" : percentage >= 60 ? "Great job! 👏" : "Keep practicing! 💪"}
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
            <CardTitle className="text-2xl font-display">Sports Trivia</CardTitle>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-bold">{score} / {currentQuestion}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentQuestion + 1} of {triviaQuestions.length}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <h3 className="text-xl font-semibold">{question.question}</h3>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                variant="outline"
                className={`w-full justify-start text-left h-auto py-4 px-6 ${
                  selectedAnswer === null 
                    ? "hover:bg-primary/10" 
                    : index === question.correct
                    ? "bg-green-500/20 border-green-500"
                    : selectedAnswer === index
                    ? "bg-red-500/20 border-red-500"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  {showResult && index === question.correct && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  )}
                  {showResult && selectedAnswer === index && index !== question.correct && (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                  <span className="flex-1">{option}</span>
                </div>
              </Button>
            ))}
          </div>

          {showResult && (
            <div className="p-4 bg-muted/50 rounded-lg animate-fade-in">
              <p className="text-sm font-medium mb-2">Explanation:</p>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          )}

          {showResult && (
            <Button onClick={nextQuestion} className="w-full">
              {currentQuestion < triviaQuestions.length - 1 ? "Next Question" : "Finish"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SportsTrivia;
