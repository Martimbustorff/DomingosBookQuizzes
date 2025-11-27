-- First, clean up existing duplicate books (keep oldest entry per open_library_id)
DELETE FROM books a 
USING books b
WHERE a.id > b.id 
  AND a.open_library_id = b.open_library_id 
  AND a.open_library_id IS NOT NULL;

-- Then add unique constraint on open_library_id to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_open_library_id_unique 
ON books (open_library_id) 
WHERE open_library_id IS NOT NULL;