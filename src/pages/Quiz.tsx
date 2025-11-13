import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Volume2 } from "lucide-react";

interface Question {
  text: string;
  options: string[];
  correct_index: number;
}

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookId = searchParams.get("bookId");
  const numQuestions = parseInt(searchParams.get("questions") || "10");
  const difficulty = searchParams.get("difficulty") || "medium";

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  // Fetch or generate quiz
  const { data: quizData, isLoading } = useQuery({
    queryKey: ["quiz", bookId, numQuestions, difficulty],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { bookId, numQuestions, difficulty },
      });

      if (error) {
        toast.error("Failed to generate quiz. Please try again.");
        throw error;
      }

      // Track quiz start event
      await supabase.from("events").insert({
        event_type: "quiz_started",
        book_id: bookId,
        age_band: difficulty,
      });

      return data;
    },
  });

  const questions: Question[] = quizData?.questions || [];
  const currentQ = questions[currentQuestion];

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    setShowFeedback(true);

    const isCorrect = index === currentQ.correct_index;
    setAnswers([...answers, isCorrect]);
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz complete - track event and navigate to results
      supabase.from("events").insert({
        event_type: "quiz_completed",
        book_id: bookId,
        age_band: difficulty,
        score: score,
      });

      navigate(
        `/result?score=${score}&total=${questions.length}&bookId=${bookId}`
      );
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    // Auto-advance after feedback
    if (showFeedback) {
      const timer = setTimeout(handleNext, 2000);
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  if (isLoading || !currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-lg">Preparing your quiz... 📚</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground font-medium">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span className="gradient-text">Score: {score}</span>
          </div>
          <Progress value={progress} className="h-4" />
        </div>

        {/* Question */}
        <Card className="p-8 space-y-4">
          <div className="flex items-start gap-4">
            <h2 className="text-2xl md:text-3xl font-bold flex-1 gradient-text">
              {currentQ.text}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full flex-shrink-0 hover:bg-accent/20"
              onClick={() => speakText(currentQ.text)}
            >
              <Volume2 className="h-6 w-6" />
            </Button>
          </div>
        </Card>

        {/* Options */}
        <div className="space-y-4">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQ.correct_index;
            const showCorrect = showFeedback && isCorrect;
            const showWrong = showFeedback && isSelected && !isCorrect;

            return (
              <Card
                key={index}
                className={`p-6 cursor-pointer transition-all quiz-button ${
                  showCorrect
                    ? "bg-quiz-correct border-2 border-quiz-correct-border"
                    : showWrong
                    ? "bg-quiz-wrong border-2 border-quiz-wrong-border"
                    : isSelected
                    ? "border-2 border-primary shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-lg md:text-xl font-semibold">{option}</div>
                  {showCorrect && <span className="text-3xl">✓</span>}
                  {showWrong && <span className="text-3xl">✗</span>}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <Card className="p-8 text-center space-y-4 animate-in fade-in">
            {selectedAnswer === currentQ.correct_index ? (
              <>
                <p className="text-4xl animate-pop-in">🎉</p>
                <p className="text-2xl font-bold text-success">Awesome! You got it!</p>
              </>
            ) : (
              <>
                <p className="text-4xl animate-wiggle">💪</p>
                <p className="text-2xl font-bold">Good try! Keep going!</p>
                <p className="text-muted-foreground text-lg font-medium mt-2">
                  The answer was: {currentQ.options[currentQ.correct_index]}
                </p>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Quiz;