-- Fix: Add admin role authorization check to delete_book_and_related function
-- This prevents any authenticated user from calling this SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.delete_book_and_related(book_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller has admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Delete related records first
  DELETE FROM quiz_templates WHERE book_id = book_id_param;
  DELETE FROM events WHERE book_id = book_id_param;
  DELETE FROM popular_books WHERE book_id = book_id_param;
  DELETE FROM youtube_videos WHERE book_id = book_id_param;
  DELETE FROM book_content WHERE book_id = book_id_param;
  DELETE FROM user_quiz_questions WHERE book_id = book_id_param;
  UPDATE user_books SET merged_to_book_id = NULL WHERE merged_to_book_id = book_id_param;
  
  -- Finally delete the book
  DELETE FROM books WHERE id = book_id_param;
END;
$$;