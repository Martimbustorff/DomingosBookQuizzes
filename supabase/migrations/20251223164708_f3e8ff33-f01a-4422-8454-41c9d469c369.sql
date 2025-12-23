
-- 1. Fix Security Definer Views - Recreate as SECURITY INVOKER

-- Drop and recreate parent_dashboard_summary as SECURITY INVOKER
DROP VIEW IF EXISTS public.parent_dashboard_summary;
CREATE VIEW public.parent_dashboard_summary 
WITH (security_invoker = true)
AS
SELECT 
  gr.guardian_id,
  gr.student_id,
  p.display_name,
  COALESCE(us.total_points, 0) AS total_points,
  COALESCE(us.quizzes_completed, 0) AS quizzes_completed,
  COALESCE(us.books_read, 0) AS books_read,
  COALESCE(us.current_streak, 0) AS current_streak,
  COALESCE(us.longest_streak, 0) AS longest_streak,
  us.last_quiz_date
FROM guardian_relationships gr
JOIN profiles p ON gr.student_id = p.user_id
LEFT JOIN user_stats us ON gr.student_id = us.user_id
WHERE gr.status = 'approved';

-- Drop and recreate popular_books_dynamic as SECURITY INVOKER
DROP VIEW IF EXISTS public.popular_books_dynamic;
CREATE VIEW public.popular_books_dynamic 
WITH (security_invoker = true)
AS
SELECT * FROM get_popular_books_dynamic();

-- 2. Fix Profiles Table Public Exposure
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view relevant profiles" 
ON public.profiles FOR SELECT USING (
  auth.uid() = user_id
  OR is_guardian_of(user_id)
  OR EXISTS (
    SELECT 1 FROM guardian_relationships 
    WHERE student_id = auth.uid() 
    AND guardian_id = profiles.user_id
    AND status = 'approved'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fix Request Logs INSERT Policy - Remove public insert capability
DROP POLICY IF EXISTS "Allow service role to insert request logs" ON public.request_logs;

-- Service role bypasses RLS entirely, so we don't need a policy for it
-- Instead, we ensure NO public/authenticated users can insert
-- By removing the policy and not adding a new one for anon/authenticated,
-- only service_role (which bypasses RLS) can insert
