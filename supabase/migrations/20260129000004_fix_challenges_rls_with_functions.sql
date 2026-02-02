-- Fix infinite recursion in challenges RLS policies using SECURITY DEFINER functions
-- The recursion occurs because:
--   challenges RLS → queries challenge_participants → challenge_participants RLS → queries challenges → LOOP
--
-- Solution: Use SECURITY DEFINER functions that bypass RLS for cross-table lookups

-- Step 1: Create helper functions that bypass RLS

-- Function to get patient IDs for a user (bypasses patients RLS)
CREATE OR REPLACE FUNCTION get_user_patient_ids(user_uuid UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT id FROM patients WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to get challenge IDs owned by a nutri (bypasses challenges RLS)
CREATE OR REPLACE FUNCTION get_nutri_challenge_ids(nutri_uuid UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT id FROM challenges WHERE nutri_id = nutri_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if a user is a participant in a challenge (bypasses RLS)
CREATE OR REPLACE FUNCTION user_participates_in_challenge(challenge_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM challenge_participants cp
    INNER JOIN patients p ON p.id = cp.patient_id
    WHERE cp.challenge_id = challenge_uuid
    AND p.user_id = user_uuid
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_patient_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nutri_challenge_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_participates_in_challenge(UUID, UUID) TO authenticated;

-- Step 2: Drop ALL existing policies on challenges and challenge_participants
DROP POLICY IF EXISTS "Nutris can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can create challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can update own challenges" ON challenges;
DROP POLICY IF EXISTS "Nutris can delete own challenges" ON challenges;
DROP POLICY IF EXISTS "Patients can view participated challenges" ON challenges;
DROP POLICY IF EXISTS "Users can manage own challenges" ON challenges;
DROP POLICY IF EXISTS "Patients can view their challenges" ON challenges;

DROP POLICY IF EXISTS "Nutris can view challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Nutris can add challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Nutris can update challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Nutris can remove challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Patients can view own participations" ON challenge_participants;
DROP POLICY IF EXISTS "Nutris manage participants" ON challenge_participants;
DROP POLICY IF EXISTS "Patients view own participations" ON challenge_participants;

-- Step 3: Create new RLS policies using SECURITY DEFINER functions

-- Challenges: Nutris can manage their own challenges (simple, no cross-table lookup)
CREATE POLICY "Nutris manage own challenges"
  ON challenges FOR ALL
  TO authenticated
  USING (nutri_id = auth.uid())
  WITH CHECK (nutri_id = auth.uid());

-- Challenges: Patients can view challenges they participate in (uses SECURITY DEFINER function)
CREATE POLICY "Patients view participated challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (user_participates_in_challenge(id, auth.uid()));

-- Challenge Participants: Nutris can manage participants (uses SECURITY DEFINER function)
CREATE POLICY "Nutris manage challenge participants"
  ON challenge_participants FOR ALL
  TO authenticated
  USING (challenge_id IN (SELECT get_nutri_challenge_ids(auth.uid())))
  WITH CHECK (challenge_id IN (SELECT get_nutri_challenge_ids(auth.uid())));

-- Challenge Participants: Patients can view their own participations (uses SECURITY DEFINER function)
CREATE POLICY "Patients view own challenge participations"
  ON challenge_participants FOR SELECT
  TO authenticated
  USING (patient_id IN (SELECT get_user_patient_ids(auth.uid())));

-- Step 4: Challenge Checkins policies (also need to avoid recursion)
DROP POLICY IF EXISTS "Nutris can view challenge checkins" ON challenge_checkins;
DROP POLICY IF EXISTS "Patients can manage own checkins" ON challenge_checkins;

-- Function to check if user can access a participant record
CREATE OR REPLACE FUNCTION user_owns_participation(participant_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM challenge_participants cp
    INNER JOIN patients p ON p.id = cp.patient_id
    WHERE cp.id = participant_uuid
    AND p.user_id = user_uuid
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if nutri owns the challenge for a participation
CREATE OR REPLACE FUNCTION nutri_owns_participation(participant_uuid UUID, nutri_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM challenge_participants cp
    INNER JOIN challenges c ON c.id = cp.challenge_id
    WHERE cp.id = participant_uuid
    AND c.nutri_id = nutri_uuid
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION user_owns_participation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION nutri_owns_participation(UUID, UUID) TO authenticated;

-- Checkins: Patients can manage their own checkins
CREATE POLICY "Patients manage own checkins"
  ON challenge_checkins FOR ALL
  TO authenticated
  USING (user_owns_participation(participant_id, auth.uid()))
  WITH CHECK (user_owns_participation(participant_id, auth.uid()));

-- Checkins: Nutris can view checkins for their challenges
CREATE POLICY "Nutris view challenge checkins"
  ON challenge_checkins FOR SELECT
  TO authenticated
  USING (nutri_owns_participation(participant_id, auth.uid()));
