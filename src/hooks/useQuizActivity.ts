import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useQuizActivity = (days: number = 7) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizActivity = async () => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: quizzes, error } = await supabase
          .from('quiz_history')
          .select('completed_at, difficulty')
          .gte('completed_at', startDate.toISOString());

        if (error) throw error;

        // Group by date and difficulty
        const grouped = quizzes?.reduce((acc: any, quiz) => {
          const date = new Date(quiz.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!acc[date]) {
            acc[date] = { date, easy: 0, medium: 0, hard: 0 };
          }
          acc[date][quiz.difficulty] = (acc[date][quiz.difficulty] || 0) + 1;
          return acc;
        }, {});

        setData(Object.values(grouped || {}));
      } catch (error) {
        console.error('Error fetching quiz activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizActivity();
  }, [days]);

  return { data, loading };
};
