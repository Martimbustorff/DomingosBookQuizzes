-- Security hardening: privilege escalation, score forgery, analytics exposure, event spoofing
-- Addresses: C1 (self-grant admin), M4 (forged scores), M5 (anon-callable analytics), M6 (event user spoofing)

-- =====================================================================
-- C1. Prevent privilege escalation via self-inserted admin/teacher roles
-- The old policy allowed inserting ANY role for yourself, so any user
-- could grant themselves 'admin'. Restrict self-insert to student/parent.
-- Admin-managed inserts continue via the "Admins can insert roles" policy.
-- =====================================================================
DROP POLICY IF EXISTS "Users can insert their own roles during signup" ON public.user_roles;

CREATE POLICY "Users can self-assign non-privileged roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('student'::app_role, 'parent'::app_role)
  );

-- =====================================================================
-- M4. Bound quiz_history values so scores/points cannot be arbitrarily forged
-- =====================================================================
DROP POLICY IF EXISTS "Users can insert their own quiz history" ON public.quiz_history;

CREATE POLICY "Users can insert their own quiz history"
  ON public.quiz_history FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND total_questions > 0
    AND total_questions <= 50
    AND score >= 0
    AND score <= total_questions
    AND points_earned >= 0
    AND points_earned <= 1000
  );

-- M4 (cont.) user_stats: prevent negative/garbage values on self-update.
-- (Full anti-cheat requires server-side stat writes; this blocks the blatant cases.)
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND total_points >= 0
    AND quizzes_completed >= 0
    AND books_read >= 0
    AND current_streak >= 0
    AND longest_streak >= 0
  );

-- =====================================================================
-- M6. events INSERT: forbid attributing events to other users
-- Previously WITH CHECK (true) let an authenticated user forge any user_id.
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;

CREATE POLICY "Authenticated users can insert own events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- =====================================================================
-- M5. Gate SECURITY DEFINER analytics/leaderboard RPCs to admins only.
-- These bypass RLS and previously ran for anon/any authenticated user,
-- exposing every user's id/name/points and site-wide analytics.
-- Rewritten in plpgsql with an explicit admin check; signatures unchanged.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.count_active_users_today()
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM quiz_history
    WHERE DATE(completed_at) = CURRENT_DATE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_average_quiz_score()
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN (
    SELECT COALESCE(ROUND(AVG(score)::numeric, 1), 0)
    FROM quiz_history
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_book_utilization()
RETURNS TABLE(books_with_quizzes bigint, total_books bigint, percentage numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT
    COUNT(DISTINCT qh.book_id) AS books_with_quizzes,
    (SELECT COUNT(*) FROM books) AS total_books,
    ROUND((COUNT(DISTINCT qh.book_id)::numeric / NULLIF((SELECT COUNT(*) FROM books), 0)) * 100, 1) AS percentage
  FROM quiz_history qh;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_weekly_active_users()
RETURNS TABLE(activity_date date, active_users bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT
    DATE(completed_at) AS activity_date,
    COUNT(DISTINCT user_id) AS active_users
  FROM quiz_history
  WHERE completed_at >= CURRENT_DATE - INTERVAL '6 days'
  GROUP BY DATE(completed_at)
  ORDER BY DATE(completed_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  total_points integer,
  quizzes_completed integer,
  avg_score numeric,
  last_active timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT
    us.user_id,
    p.display_name,
    us.total_points,
    us.quizzes_completed,
    ROUND(AVG(qh.score)::numeric, 1) AS avg_score,
    MAX(qh.completed_at) AS last_active
  FROM user_stats us
  LEFT JOIN profiles p ON p.user_id = us.user_id
  LEFT JOIN quiz_history qh ON qh.user_id = us.user_id
  GROUP BY us.user_id, p.display_name, us.total_points, us.quizzes_completed
  ORDER BY us.total_points DESC
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_visitor_stats()
RETURNS TABLE(
  total_visitor_events bigint,
  visitor_quiz_starts bigint,
  visitor_quiz_completions bigint,
  visitor_completion_rate numeric,
  total_authenticated_events bigint,
  authenticated_quiz_starts bigint,
  authenticated_quiz_completions bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE e.user_id IS NULL) AS total_visitor_events,
    COUNT(*) FILTER (WHERE e.user_id IS NULL AND e.event_type = 'quiz_started') AS visitor_quiz_starts,
    COUNT(*) FILTER (WHERE e.user_id IS NULL AND e.event_type = 'quiz_completed') AS visitor_quiz_completions,
    CASE
      WHEN COUNT(*) FILTER (WHERE e.user_id IS NULL AND e.event_type = 'quiz_started') > 0
      THEN ROUND((COUNT(*) FILTER (WHERE e.user_id IS NULL AND e.event_type = 'quiz_completed')::numeric /
                  COUNT(*) FILTER (WHERE e.user_id IS NULL AND e.event_type = 'quiz_started')) * 100, 1)
      ELSE 0
    END AS visitor_completion_rate,
    COUNT(*) FILTER (WHERE e.user_id IS NOT NULL) AS total_authenticated_events,
    COUNT(*) FILTER (WHERE e.user_id IS NOT NULL AND e.event_type = 'quiz_started') AS authenticated_quiz_starts,
    COUNT(*) FILTER (WHERE e.user_id IS NOT NULL AND e.event_type = 'quiz_completed') AS authenticated_quiz_completions
  FROM events e;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_visitor_activity(days_back integer DEFAULT 30)
RETURNS TABLE(
  activity_date date,
  visitor_events bigint,
  authenticated_events bigint,
  visitor_quiz_starts bigint,
  visitor_quiz_completions bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT
    DATE(e.timestamp) AS activity_date,
    COUNT(*) FILTER (WHERE e.user_id IS NULL) AS visitor_events,
    COUNT(*) FILTER (WHERE e.user_id IS NOT NULL) AS authenticated_events,
    COUNT(*) FILTER (WHERE e.user_id IS NULL AND e.event_type = 'quiz_started') AS visitor_quiz_starts,
    COUNT(*) FILTER (WHERE e.user_id IS NULL AND e.event_type = 'quiz_completed') AS visitor_quiz_completions
  FROM events e
  WHERE e.timestamp >= CURRENT_DATE - (days_back || ' days')::interval
  GROUP BY DATE(e.timestamp)
  ORDER BY DATE(e.timestamp) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_visitor_popular_books(limit_count integer DEFAULT 10)
RETURNS TABLE(
  book_id uuid,
  title text,
  author text,
  cover_url text,
  visitor_quiz_starts bigint,
  visitor_quiz_completions bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT
    b.id AS book_id,
    b.title,
    b.author,
    b.cover_url,
    COUNT(*) FILTER (WHERE e.event_type = 'quiz_started') AS visitor_quiz_starts,
    COUNT(*) FILTER (WHERE e.event_type = 'quiz_completed') AS visitor_quiz_completions
  FROM books b
  INNER JOIN events e ON e.book_id = b.id
  WHERE e.user_id IS NULL
  GROUP BY b.id, b.title, b.author, b.cover_url
  ORDER BY COUNT(*) FILTER (WHERE e.event_type = 'quiz_started') DESC
  LIMIT limit_count;
END;
$$;

-- =====================================================================
-- M5 (cont.) Restrict maintenance RPC so anyone cannot purge rate-limit logs
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.cleanup_old_request_logs() FROM anon, authenticated, public;
