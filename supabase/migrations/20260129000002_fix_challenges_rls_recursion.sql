-- Fix infinite recursion in challenges RLS policies
-- The issue was that policies were checking conditions that triggered other policies

-- Drop existing policies
DROP POLICY IF EXISTS "Nutris can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can create challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can update own challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can delete own challenges" ON challenges;
DROP POLICY IF EXISTS "Patients can view participated challenges" ON challenges;

-- Recreate policies with simpler conditions that don't cause recursion

-- Challenges: Nutris can manage their own challenges
CREATE POLICY "Nutris can view own challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (nutri_id = auth.uid());

CREATE POLICY "Nutris can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (nutri_id = auth.uid());

CREATE POLICY "Nutris can update own challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (nutri_id = auth.uid())
  WITH CHECK (nutri_id = auth.uid());

CREATE POLICY "Nutris can delete own challenges"
  ON challenges FOR DELETE
  TO authenticated
  USING (nutri_id = auth.uid());

-- Patients can view challenges they participate in (separate policy)
-- Using a simpler subquery that doesn't reference back to challenges
CREATE POLICY "Patients can view participated challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT cp.challenge_id
      FROM challenge_participants cp
      INNER JOIN patients p ON p.id = cp.patient_id
      WHERE p.user_id = auth.uid()
    )
  );
