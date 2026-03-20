-- Prevent duplicate patients per nutritionist by email.
-- Uses a partial index (WHERE email IS NOT NULL) so patients without
-- email are not affected by the constraint.

-- Safety check: log any existing duplicates before creating the index.
-- This query will surface in the migration output if duplicates exist.
DO $$
DECLARE
  dup_count integer;
BEGIN
  SELECT count(*) INTO dup_count
  FROM (
    SELECT nutri_id, email, count(*)
    FROM patients
    WHERE email IS NOT NULL
    GROUP BY nutri_id, email
    HAVING count(*) > 1
  ) dupes;

  IF dup_count > 0 THEN
    RAISE WARNING '[patient_email_unique] Found % duplicate nutri_id+email pairs. Review before relying on constraint.', dup_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_nutri_email_unique
ON patients (nutri_id, email)
WHERE email IS NOT NULL;
