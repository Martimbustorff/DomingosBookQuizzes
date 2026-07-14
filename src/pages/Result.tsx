import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, RotateCcw, BookOpen, TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { computeQuizPoints } from "@/lib/achievements";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const Result = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const score = parseInt(searchParams.get("score") || "0");
  const total = parseInt(searchParams.get("total") || "10");
  const bookId = searchParams.get("bookId");

  const percentage = Math.round((score / total) * 100);
  const points = computeQuizPoints(score);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // This screen is display-only. The completed quiz (stats, history and
  // per-question responses) is already persisted once, in Quiz.tsx, before
  // navigating here. We only celebrate, refresh cached data, and keep an
  // offline points tally for anonymous users.
  useEffect(() => {
    if (percentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const finalize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        // Stats were written by Quiz.tsx; just refresh anything cached.
        queryClient.invalidateQueries({ queryKey: ["user-stats"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["parent-dashboard-children"] });
      } else {
        // Offline points tally for non-authenticated users
        const currentPoints = parseInt(localStorage.getItem("totalPoints") || "0");
        localStorage.setItem("totalPoints", (currentPoints + points).toString());
      }
    };

    finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine stars and message
  const getStarsAndMessage = () => {
    if (percentage >= 90) {
      return { stars: 3, message: "Amazing! You're a reading superstar! 🌟" };
    } else if (percentage >= 70) {
      return { stars: 2, message: "Great job! You really know this book! 📚" };
    } else if (percentage >= 50) {
      return { stars: 1, message: "Good effort! Keep practicing! 💪" };
    } else {
      return { stars: 0, message: "Nice try! Want to read it again? 📖" };
    }
  };

  const { stars, message } = getStarsAndMessage();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <Card className="p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-8 text-center">
          {/* Stars */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className={`h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ${
                  i <= stars
                    ? "fill-primary text-primary animate-pop-in"
                    : "text-muted"
                }`}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>

          {/* Score */}
          <div className="space-y-3 sm:space-y-4">
            <p className="text-5xl sm:text-6xl font-bold text-foreground">
              {score} / {total}
            </p>
            <p className="text-xl sm:text-2xl font-semibold">{message}</p>
          </div>

          {/* Points */}
          <Card className="p-6 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-lg">
              <span className="text-3xl">🪙</span> You earned{" "}
              <span className="font-bold text-foreground text-2xl">+{points} points</span>
            </p>
          </Card>

          {/* Encouragement */}
          <div className="space-y-2 text-muted-foreground text-base sm:text-lg font-medium px-2">
            {percentage >= 70 ? (
              <p>You really understood this story! Keep it up! 🎉</p>
            ) : (
              <p>
                Reading is a journey. Every quiz makes you better! 🚀
              </p>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3 sm:space-y-4">
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 sm:h-16 text-lg sm:text-xl rounded-[24px] quiz-button font-semibold min-h-[56px]"
            onClick={() => navigate(`/book/${bookId}`)}
          >
            <RotateCcw className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            🔁 Try again
          </Button>

          <Button
            size="lg"
            variant="default"
            className="w-full h-14 sm:h-16 text-lg sm:text-xl rounded-[24px] quiz-button font-semibold min-h-[56px]"
            onClick={() => navigate("/search")}
          >
            <BookOpen className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            📚 Choose another book
          </Button>

          {!isAuthenticated ? (
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
              <div className="space-y-4 text-center">
                <p className="text-lg font-semibold text-foreground">
                  🎉 Great job! Want to save your progress?
                </p>
                <p className="text-sm text-muted-foreground">
                  Create an account to track points, earn badges, and build your reading streak!
                </p>
                <Button
                  size="lg"
                  variant="accent"
                  className="w-full min-h-[56px]"
                  onClick={() => navigate("/signup")}
                >
                  <TrendingUp className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  🏆 Create Account
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              size="lg"
              variant="accent"
              className="w-full min-h-[56px]"
              onClick={() => navigate("/dashboard")}
            >
              <TrendingUp className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              📊 View Dashboard
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 sm:h-16 text-lg sm:text-xl rounded-[24px] quiz-button font-semibold min-h-[56px]"
            onClick={() => navigate("/")}
          >
            🏠 Go home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Result;