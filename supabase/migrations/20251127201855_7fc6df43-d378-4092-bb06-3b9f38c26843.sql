-- Fix 1: Drop partial unique index and create normal unique constraint
DROP INDEX IF EXISTS idx_books_open_library_id_unique;
ALTER TABLE books ADD CONSTRAINT books_open_library_id_key UNIQUE (open_library_id);

-- Fix 2: Delete wrong quiz data for "Do Lions Hate Haircuts?"
DELETE FROM quiz_templates 
WHERE book_id IN (
  SELECT id FROM books 
  WHERE title ILIKE '%lions%haircut%'
);

DELETE FROM book_content 
WHERE book_id IN (
  SELECT id FROM books 
  WHERE title ILIKE '%lions%haircut%'
);