-- Create challenges system tables
-- MVP: Simple challenge with daily check-ins

-- Challenges table
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  nutri_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participants table
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  badge_earned BOOLEAN DEFAULT FALSE,
  UNIQUE(challenge_id, patient_id)
);

-- Challenge check-ins table
CREATE TABLE challenge_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, checkin_date)
);

-- Indexes for performance
CREATE INDEX idx_challenges_nutri_id ON challenges(nutri_id);
CREATE INDEX idx_challenges_org_id ON challenges(org_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_patient_id ON challenge_participants(patient_id);
CREATE INDEX idx_challenge_checkins_participant_id ON challenge_checkins(participant_id);
CREATE INDEX idx_challenge_checkins_date ON challenge_checkins(checkin_date);

-- Updated_at trigger for challenges
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_checkins ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS Policies
-- =====================

-- Challenges: Nutris can manage their own challenges
CREATE POLICY "Nutris can view own challenges"
  ON challenges FOR SELECT
  USING (nutri_id = auth.uid());

CREATE POLICY "Nutris can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (nutri_id = auth.uid());

CREATE POLICY "Nutris can update own challenges"
  ON challenges FOR UPDATE
  USING (nutri_id = auth.uid());

CREATE POLICY "Nutris can delete own challenges"
  ON challenges FOR DELETE
  USING (nutri_id = auth.uid());

-- Challenge Participants: Nutris can manage participants of their challenges
CREATE POLICY "Nutris can view challenge participants"
  ON challenge_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_participants.challenge_id
      AND challenges.nutri_id = auth.uid()
    )
  );

CREATE POLICY "Nutris can add challenge participants"
  ON challenge_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_participants.challenge_id
      AND challenges.nutri_id = auth.uid()
    )
  );

CREATE POLICY "Nutris can update challenge participants"
  ON challenge_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_participants.challenge_id
      AND challenges.nutri_id = auth.uid()
    )
  );

CREATE POLICY "Nutris can remove challenge participants"
  ON challenge_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_participants.challenge_id
      AND challenges.nutri_id = auth.uid()
    )
  );

-- Patients can view their own participations
CREATE POLICY "Patients can view own participations"
  ON challenge_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = challenge_participants.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Patients can view challenges they participate in
CREATE POLICY "Patients can view participated challenges"
  ON challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      JOIN patients p ON p.id = cp.patient_id
      WHERE cp.challenge_id = challenges.id
      AND p.user_id = auth.uid()
    )
  );

-- Check-ins: Nutris can view check-ins of their challenges
CREATE POLICY "Nutris can view challenge checkins"
  ON challenge_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      JOIN challenges c ON c.id = cp.challenge_id
      WHERE cp.id = challenge_checkins.participant_id
      AND c.nutri_id = auth.uid()
    )
  );

-- Patients can view their own check-ins
CREATE POLICY "Patients can view own checkins"
  ON challenge_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      JOIN patients p ON p.id = cp.patient_id
      WHERE cp.id = challenge_checkins.participant_id
      AND p.user_id = auth.uid()
    )
  );

-- Patients can create their own check-ins
CREATE POLICY "Patients can create own checkins"
  ON challenge_checkins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      JOIN patients p ON p.id = cp.patient_id
      WHERE cp.id = challenge_checkins.participant_id
      AND p.user_id = auth.uid()
    )
  );

-- Patients can update their own check-ins (e.g., add notes)
CREATE POLICY "Patients can update own checkins"
  ON challenge_checkins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      JOIN patients p ON p.id = cp.patient_id
      WHERE cp.id = challenge_checkins.participant_id
      AND p.user_id = auth.uid()
    )
  );
