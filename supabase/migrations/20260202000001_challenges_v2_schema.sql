-- =============================================
-- CHALLENGES V2 SCHEMA
-- Adiciona suporte a Fases, Metas tipadas, e Conquistas
-- =============================================

-- =============================================
-- CHALLENGE PHASES (Fases)
-- =============================================
CREATE TABLE challenge_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  completion_threshold INTEGER NOT NULL DEFAULT 100, -- porcentagem (0-100)
  status VARCHAR(20) NOT NULL DEFAULT 'locked', -- locked, active, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_phase_threshold CHECK (completion_threshold >= 0 AND completion_threshold <= 100),
  CONSTRAINT valid_phase_status CHECK (status IN ('locked', 'active', 'completed'))
);

CREATE INDEX idx_phases_challenge ON challenge_phases(challenge_id);
CREATE INDEX idx_phases_order ON challenge_phases(challenge_id, order_index);

-- =============================================
-- CHALLENGE GOALS (Metas)
-- =============================================
CREATE TABLE challenge_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES challenge_phases(id) ON DELETE CASCADE, -- nullable para metas avulsas
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'checkin', -- checkin, photo, metric
  metric_type VARCHAR(20), -- weight, waist, hip, body_fat, water (só se type = metric)
  duration_days INTEGER NOT NULL DEFAULT 21,
  order_index INTEGER NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_goal_type CHECK (type IN ('checkin', 'photo', 'metric')),
  CONSTRAINT valid_goal_metric_type CHECK (
    (type != 'metric') OR
    (metric_type IN ('weight', 'waist', 'hip', 'body_fat', 'water'))
  )
);

CREATE INDEX idx_goals_challenge ON challenge_goals(challenge_id);
CREATE INDEX idx_goals_phase ON challenge_goals(phase_id);
CREATE INDEX idx_goals_order ON challenge_goals(phase_id, order_index);

-- =============================================
-- GOAL CHECKINS (Check-ins das metas)
-- =============================================
CREATE TABLE goal_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES challenge_goals(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  notes TEXT,
  image_url TEXT, -- para type = photo
  metric_value DECIMAL(10,2), -- para type = metric
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, goal_id, checkin_date)
);

CREATE INDEX idx_goal_checkins_participant ON goal_checkins(participant_id);
CREATE INDEX idx_goal_checkins_goal ON goal_checkins(goal_id);
CREATE INDEX idx_goal_checkins_date ON goal_checkins(checkin_date);

-- =============================================
-- PARTICIPANT PROGRESS (Novos campos em challenge_participants)
-- =============================================
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS current_phase_id UUID REFERENCES challenge_phases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_goal_id UUID REFERENCES challenge_goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

-- =============================================
-- PARTICIPANT ACHIEVEMENTS (Conquistas)
-- =============================================
CREATE TABLE participant_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES challenge_goals(id) ON DELETE CASCADE, -- nullable para conquistas de fase/desafio
  phase_id UUID REFERENCES challenge_phases(id) ON DELETE CASCADE,
  achievement_type VARCHAR(30) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_achievement_type CHECK (
    achievement_type IN (
      'streak_7', 'streak_14', 'streak_21',
      'goal_complete', 'phase_complete', 'challenge_complete'
    )
  )
);

-- Unique constraint que permite NULL em goal_id
CREATE UNIQUE INDEX idx_unique_achievement ON participant_achievements(participant_id, COALESCE(goal_id, '00000000-0000-0000-0000-000000000000'::uuid), achievement_type);

CREATE INDEX idx_achievements_participant ON participant_achievements(participant_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Phases: nutri pode gerenciar
ALTER TABLE challenge_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutris can manage challenge phases"
  ON challenge_phases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_phases.challenge_id
      AND challenges.nutri_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their challenge phases"
  ON challenge_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenge_phases.challenge_id
      AND cp.patient_id IN (
        SELECT id FROM patients WHERE user_id = auth.uid()
      )
    )
  );

-- Goals: nutri pode gerenciar
ALTER TABLE challenge_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutris can manage challenge goals"
  ON challenge_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_goals.challenge_id
      AND challenges.nutri_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their challenge goals"
  ON challenge_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenge_goals.challenge_id
      AND cp.patient_id IN (
        SELECT id FROM patients WHERE user_id = auth.uid()
      )
    )
  );

-- Goal Checkins: paciente pode gerenciar os próprios
ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own goal checkins"
  ON goal_checkins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.id = goal_checkins.participant_id
      AND cp.patient_id IN (
        SELECT id FROM patients WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Nutris can view goal checkins"
  ON goal_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      JOIN challenges c ON c.id = cp.challenge_id
      WHERE cp.id = goal_checkins.participant_id
      AND c.nutri_id = auth.uid()
    )
  );

-- Achievements: somente leitura para pacientes
ALTER TABLE participant_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own achievements"
  ON participant_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.id = participant_achievements.participant_id
      AND cp.patient_id IN (
        SELECT id FROM patients WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Nutris can manage achievements"
  ON participant_achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      JOIN challenges c ON c.id = cp.challenge_id
      WHERE cp.id = participant_achievements.participant_id
      AND c.nutri_id = auth.uid()
    )
  );

-- =============================================
-- TRIGGERS para updated_at
-- =============================================
CREATE TRIGGER update_challenge_phases_updated_at
  BEFORE UPDATE ON challenge_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_goals_updated_at
  BEFORE UPDATE ON challenge_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
