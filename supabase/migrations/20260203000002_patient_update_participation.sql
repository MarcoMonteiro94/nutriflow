-- =============================================
-- ALLOW PATIENTS TO UPDATE THEIR OWN PARTICIPATION
-- =============================================

-- Function to check if user owns a participation (for UPDATE policy)
CREATE OR REPLACE FUNCTION user_owns_participant_record(participant_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM challenge_participants cp
    INNER JOIN patients p ON p.id = cp.patient_id
    WHERE cp.id = participant_uuid
    AND p.user_id = user_uuid
  );
$$;

-- Policy: Patients can update their own participation record (for streak/progress tracking)
CREATE POLICY "Patients can update own participation"
  ON challenge_participants FOR UPDATE
  TO authenticated
  USING (user_owns_participant_record(id, auth.uid()))
  WITH CHECK (user_owns_participant_record(id, auth.uid()));

-- Also need to allow patients to INSERT achievements
-- (achievements are created when goals/phases are completed)
CREATE POLICY "Patients can insert own achievements"
  ON participant_achievements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      INNER JOIN patients p ON p.id = cp.patient_id
      WHERE cp.id = participant_achievements.participant_id
      AND p.user_id = auth.uid()
    )
  );

-- Allow patients to update challenge phases status (for phase progression)
CREATE POLICY "Patients can update challenge phases status"
  ON challenge_phases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      INNER JOIN patients p ON p.id = cp.patient_id
      WHERE cp.challenge_id = challenge_phases.challenge_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      INNER JOIN patients p ON p.id = cp.patient_id
      WHERE cp.challenge_id = challenge_phases.challenge_id
      AND p.user_id = auth.uid()
    )
  );
