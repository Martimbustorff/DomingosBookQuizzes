-- Kids-only book visibility
--
-- Root problems addressed:
--  * enrich-book-data marks non-children books as enrichment_status
--    'not_for_children' but never clears their age, so with the default
--    age_max = 10 they still passed the `age_max <= 12` filters and stayed
--    visible in Search and Popular.
--  * get_popular_books_dynamic surfaced ANY book that had a quiz_completed
--    event (age-agnostic, and those events were previously forgeable) plus a
--    teen `age_max <= 14` branch — both leaked non-children books.
--
-- Fix: make enrichment_status an authoritative filter everywhere books are
-- listed, and require a real children's age band. No age band or a
-- 'not_for_children' status => hidden.

-- 1. Local search: only children's books, never 'not_for_children'.
CREATE OR REPLACE FUNCTION public.search_books_local(p_query text, p_limit integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  title text,
  author text,
  cover_url text,
  age_min integer,
  age_max integer,
  similarity_score real
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    b.id,
    b.title,
    b.author,
    b.cover_url,
    b.age_min,
    b.age_max,
    similarity(LOWER(b.title), LOWER(p_query)) as similarity_score
  FROM books b
  WHERE
    b.age_max IS NOT NULL
    AND b.age_max <= 12                                       -- children's age band only
    AND COALESCE(b.enrichment_status, '') <> 'not_for_children'
    AND (
      similarity(LOWER(b.title), LOWER(p_query)) >= 0.3
      OR LOWER(b.title) LIKE '%' || LOWER(p_query) || '%'
      OR LOWER(b.author) LIKE '%' || LOWER(p_query) || '%'
    )
  ORDER BY similarity_score DESC, b.title ASC
  LIMIT p_limit;
$function$;

-- 2. Popular: rank only verified children's books. Remove the
--    "any book with a completion event" and "age_max <= 14" loopholes.
CREATE OR REPLACE FUNCTION public.get_popular_books_dynamic()
RETURNS TABLE(ranking bigint, book_id uuid, title text, author text, cover_url text, age_min integer, age_max integer, quiz_count bigint, unique_users bigint, avg_score numeric, last_quiz_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY
        COALESCE(COUNT(*) FILTER (WHERE e.event_type = 'quiz_completed'), 0) DESC,
        CASE WHEN COALESCE(COUNT(*) FILTER (WHERE e.event_type = 'quiz_completed'), 0) = 0 THEN b.created_at END DESC NULLS LAST,
        b.title ASC
    ) AS ranking,
    b.id AS book_id,
    b.title,
    b.author,
    b.cover_url,
    b.age_min,
    b.age_max,
    COALESCE(COUNT(*) FILTER (WHERE e.event_type = 'quiz_completed'), 0) AS quiz_count,
    COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'quiz_completed' AND e.user_id IS NOT NULL) +
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'quiz_completed' AND e.user_id IS NULL) AS unique_users,
    (SELECT ROUND(AVG((qh.score::numeric / NULLIF(qh.total_questions, 0)) * 100), 1)
     FROM quiz_history qh
     WHERE qh.book_id = b.id) AS avg_score,
    MAX(e.timestamp) FILTER (WHERE e.event_type = 'quiz_completed') AS last_quiz_at
  FROM books b
  LEFT JOIN events e ON e.book_id = b.id
  WHERE b.title IS NOT NULL
    AND b.age_max IS NOT NULL
    AND b.age_max <= 12
    AND COALESCE(b.enrichment_status, '') <> 'not_for_children'
  GROUP BY b.id, b.title, b.author, b.cover_url, b.age_min, b.age_max, b.created_at
  ORDER BY
    COALESCE(COUNT(*) FILTER (WHERE e.event_type = 'quiz_completed'), 0) DESC,
    CASE WHEN COALESCE(COUNT(*) FILTER (WHERE e.event_type = 'quiz_completed'), 0) = 0 THEN b.created_at END DESC NULLS LAST,
    b.title ASC;
$function$;

-- 3. One-time cleanup: neutralize books already flagged as not-for-children
--    so they cannot re-surface. We NULL out the age band (the visibility key)
--    rather than hard-deleting, to preserve any linked history/audit rows.
--    (A hard DELETE is available via the admin delete_book_and_related RPC if
--    you later want to remove them entirely.)
UPDATE public.books
SET age_min = NULL, age_max = NULL
WHERE enrichment_status = 'not_for_children';
