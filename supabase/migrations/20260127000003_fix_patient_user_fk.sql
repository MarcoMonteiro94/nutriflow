-- Migration: Fix patient user_id foreign key
-- Change from referencing profiles(id) to auth.users(id)
-- This allows patients to be linked without needing a profile

-- Drop the existing foreign key constraint
ALTER TABLE patients
DROP CONSTRAINT IF EXISTS patients_user_id_fkey;

-- Add new foreign key to auth.users instead of profiles
ALTER TABLE patients
ADD CONSTRAINT patients_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
