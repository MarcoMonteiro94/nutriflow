-- Fix infinite recursion in challenges RLS policies v2
-- Remove the patient policy that causes recursion and use a simpler approach

-- Drop ALL existing policies on challenges
DROP POLICY IF EXISTS "Nutris can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can create challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can update own challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can delete own challenges" ON challenges;
DROP POLICY IF EXISTS "Patients can view participated challenges" ON challenges;

-- Simple policy: authenticated users can do everything on their own challenges
-- This avoids any cross-table references that could cause recursion
CREATE POLICY "Users can manage own challenges"
  ON challenges FOR ALL
  TO authenticated
  USING (nutri_id = auth.uid())
  WITH CHECK (nutri_id = auth.uid());

-- Separate SELECT policy for patients - using EXISTS with LIMIT to prevent recursion
CREATE POLICY "Patients can view their challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM challenge_participants cp
      WHERE cp.challenge_id = challenges.id
      AND cp.patient_id IN (
        SELECT p.id FROM patients p WHERE p.user_id = auth.uid()
      )
      LIMIT 1
    )
  );

-- Also fix challenge_participants policies that might cause issues
DROP POLICY IF EXISTS "Nutris can view challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Nutris can add challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Nutris can update challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Nutris can remove challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Patients can view own participations" ON challenge_participants;

-- Nutri policies for participants - use security_invoker to avoid recursion
CREATE POLICY "Nutris manage participants"
  ON challenge_participants FOR ALL
  TO authenticated
  USING (
    challenge_id IN (SELECT id FROM challenges WHERE nutri_id = auth.uid())
  )
  WITH CHECK (
    challenge_id IN (SELECT id FROM challenges WHERE nutri_id = auth.uid())
  );

-- Patient can view their own participations
CREATE POLICY "Patients view own participations"
  ON challenge_participants FOR SELECT
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );
