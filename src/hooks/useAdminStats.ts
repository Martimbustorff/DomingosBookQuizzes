import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalBooks: 0,
    activeToday: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [users, quizzes, books, active] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('quiz_history').select('id', { count: 'exact', head: true }),
          supabase.from('books').select('id', { count: 'exact', head: true }),
          supabase
            .from('quiz_history')
            .select('user_id', { count: 'exact', head: true })
            .gte('completed_at', today),
        ]);

        setStats({
          totalUsers: users.count || 0,
          totalQuizzes: quizzes.count || 0,
          totalBooks: books.count || 0,
          activeToday: active.count || 0,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
