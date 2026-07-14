-- H5: guardian_relationships had no foreign keys to profiles, so the PostgREST
-- embeds used by the invitation UI
--   profiles!guardian_relationships_guardian_id_fkey(...)
--   profiles!guardian_relationships_student_id_fkey(...)
-- could not resolve and every embedded query failed (empty invitation lists,
-- valid invitations reported as invalid).
--
-- Add the two foreign keys with the exact constraint names the client embeds
-- reference. profiles.user_id is UNIQUE, so it is a valid FK target.
-- NOT VALID skips validation of pre-existing rows (avoids failing on any
-- historical placeholder/orphan rows); PostgREST still discovers and uses the
-- relationship for embedding.

ALTER TABLE public.guardian_relationships
  ADD CONSTRAINT guardian_relationships_guardian_id_fkey
  FOREIGN KEY (guardian_id) REFERENCES public.profiles(user_id)
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE public.guardian_relationships
  ADD CONSTRAINT guardian_relationships_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(user_id)
  ON DELETE CASCADE
  NOT VALID;
