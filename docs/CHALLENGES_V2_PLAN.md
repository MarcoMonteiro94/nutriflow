# Sistema de Desafios v2 - Plano de Implementação

## Visão Geral

Evolução do sistema de desafios para suportar **Fases**, **Metas** tipadas (check-in, foto, métrica), **conquistas** e **streaks**.

### Nomenclatura

| Termo | Descrição | Exemplo |
|-------|-----------|---------|
| **Desafio** | Container principal | "Reeducação Alimentar 90 dias" |
| **Fase** | Etapa dentro do desafio (opcional) | "Fase 1: Consciência" |
| **Meta** | Tarefa individual com duração | "Foto do almoço por 21 dias" |
| **Check-in** | Registro diário do paciente | Confirmação, foto ou métrica |

### Hierarquia

```
Desafio
├── Fase 1 (opcional)
│   ├── Meta 1 (sequencial)
│   ├── Meta 2
│   └── Meta 3
├── Fase 2
│   └── ...
└── Conquistas (7d, 14d, 21d, fase, desafio)
```

---

## Regras de Negócio

### Progressão
- Metas são **sequenciais** dentro de uma fase (completa uma para desbloquear a próxima)
- Fases são **sequenciais** dentro de um desafio
- Critério de conclusão de fase: **configurável** pelo nutri (default: 100%)
- Fases são **opcionais** - pode criar meta avulsa diretamente no desafio

### Streaks
- **Rígido**: Perdeu 1 dia = streak volta para zero
- Streak atual e melhor streak são rastreados
- Conquistas baseadas em streak: 7, 14, 21 dias

### Tipos de Meta

| Tipo | Check-in requer | Integração |
|------|-----------------|------------|
| `checkin` | Confirmação (✓) | Nenhuma |
| `photo` | Upload de foto | Supabase Storage |
| `metric` | Valor numérico | Tabela measurements (se existir registro do dia) |

### Métricas Disponíveis

| Código | Label | Unidade | Integração |
|--------|-------|---------|------------|
| `weight` | Peso | kg | measurements.weight |
| `waist` | Cintura | cm | measurements.waist_circumference |
| `hip` | Quadril | cm | measurements.hip_circumference |
| `body_fat` | % Gordura | % | measurements.body_fat_percentage |
| `water` | Água | L | Novo campo ou goal_checkins |

### Imagens
- Máximo: **2MB** por foto
- Compressão automática no cliente antes do upload
- Storage: `challenge-photos/{participant_id}/{goal_id}/{date}.jpg`

---

## Sprint 1: Base (Database + Types + Forms)

### 1.1 Migration: Novas Tabelas

**Arquivo**: `supabase/migrations/[timestamp]_challenges_v2_schema.sql`

```sql
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
  CONSTRAINT valid_threshold CHECK (completion_threshold >= 0 AND completion_threshold <= 100)
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
  CONSTRAINT valid_type CHECK (type IN ('checkin', 'photo', 'metric')),
  CONSTRAINT valid_metric_type CHECK (
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
-- PARTICIPANT PROGRESS (Progresso do participante)
-- =============================================
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS current_phase_id UUID REFERENCES challenge_phases(id),
ADD COLUMN IF NOT EXISTS current_goal_id UUID REFERENCES challenge_goals(id),
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
  -- streak_7, streak_14, streak_21, goal_complete, phase_complete, challenge_complete
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, goal_id, achievement_type),
  CONSTRAINT valid_achievement CHECK (
    achievement_type IN (
      'streak_7', 'streak_14', 'streak_21',
      'goal_complete', 'phase_complete', 'challenge_complete'
    )
  )
);

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
      JOIN patients p ON p.id = cp.patient_id
      WHERE cp.challenge_id = challenge_phases.challenge_id
      AND p.user_id = auth.uid()
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
      JOIN patients p ON p.id = cp.patient_id
      WHERE cp.challenge_id = challenge_goals.challenge_id
      AND p.user_id = auth.uid()
    )
  );

-- Goal Checkins: paciente pode gerenciar os próprios
ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own goal checkins"
  ON goal_checkins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      JOIN patients p ON p.id = cp.patient_id
      WHERE cp.id = goal_checkins.participant_id
      AND p.user_id = auth.uid()
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
      JOIN patients p ON p.id = cp.patient_id
      WHERE cp.id = participant_achievements.participant_id
      AND p.user_id = auth.uid()
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

-- Trigger para updated_at
CREATE TRIGGER update_challenge_phases_updated_at
  BEFORE UPDATE ON challenge_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_goals_updated_at
  BEFORE UPDATE ON challenge_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 TypeScript Types

**Arquivo**: `src/types/database.ts` (adicionar)

```typescript
// =============================================
// CHALLENGES V2 TYPES
// =============================================

export type PhaseStatus = "locked" | "active" | "completed";

export type GoalType = "checkin" | "photo" | "metric";

export type MetricType = "weight" | "waist" | "hip" | "body_fat" | "water";

export type AchievementType =
  | "streak_7"
  | "streak_14"
  | "streak_21"
  | "goal_complete"
  | "phase_complete"
  | "challenge_complete";

export type ChallengePhase = {
  id: string;
  challenge_id: string;
  title: string;
  description: string | null;
  order_index: number;
  completion_threshold: number;
  status: PhaseStatus;
  created_at: string;
  updated_at: string;
};

export type ChallengeGoal = {
  id: string;
  challenge_id: string;
  phase_id: string | null;
  title: string;
  description: string | null;
  type: GoalType;
  metric_type: MetricType | null;
  duration_days: number;
  order_index: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GoalCheckin = {
  id: string;
  participant_id: string;
  goal_id: string;
  checkin_date: string;
  completed: boolean;
  notes: string | null;
  image_url: string | null;
  metric_value: number | null;
  created_at: string;
};

export type ParticipantAchievement = {
  id: string;
  participant_id: string;
  goal_id: string | null;
  phase_id: string | null;
  achievement_type: AchievementType;
  earned_at: string;
  created_at: string;
};

// Extended ChallengeParticipant (atualizar o existente)
export type ChallengeParticipantV2 = ChallengeParticipant & {
  current_phase_id: string | null;
  current_goal_id: string | null;
  streak_count: number;
  best_streak: number;
};

// Utility types for forms
export type GoalFormData = {
  title: string;
  description?: string;
  type: GoalType;
  metric_type?: MetricType;
  duration_days: number;
};

export type PhaseFormData = {
  title: string;
  description?: string;
  completion_threshold: number;
  goals: GoalFormData[];
};

export type ChallengeFormDataV2 = {
  title: string;
  description?: string;
  phases: PhaseFormData[];
  // ou goals diretamente se não tiver fases
  goals?: GoalFormData[];
};
```

### 1.3 Supabase Storage Bucket

**Criar via Supabase Dashboard ou migration**:

```sql
-- Storage bucket para fotos de desafios
INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-photos', 'challenge-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: pacientes podem fazer upload das próprias fotos
CREATE POLICY "Patients can upload challenge photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'challenge-photos' AND
  auth.uid() IS NOT NULL
);

-- Policy: nutris e pacientes podem ver fotos dos seus desafios
CREATE POLICY "Users can view challenge photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'challenge-photos' AND
  auth.uid() IS NOT NULL
);
```

### 1.4 Formulário de Criação (Nutri)

**Arquivos a criar/modificar**:

```
src/app/(nutri)/challenges/new/page.tsx (modificar)
src/app/(nutri)/challenges/_components/challenge-form-v2.tsx (novo)
src/app/(nutri)/challenges/_components/phase-builder.tsx (novo)
src/app/(nutri)/challenges/_components/goal-form.tsx (novo)
```

**Fluxo do formulário**:

1. **Dados básicos**: Título e descrição do desafio
2. **Estrutura**:
   - Toggle: "Usar fases?" (sim/não)
   - Se sim: Builder de fases com metas dentro
   - Se não: Lista de metas direto
3. **Cada meta**: Título, tipo (checkin/foto/métrica), duração, descrição
4. **Preview**: Visualização da estrutura antes de salvar

---

## Sprint 2: Experiência do Paciente

### 2.1 Tela de Desafio Atualizada

**Arquivo**: `src/app/patient/challenges/[id]/page.tsx`

**Componentes**:
- Progresso geral do desafio (barra)
- Indicador de fase atual
- Lista de metas com status (locked/active/completed)
- Meta atual expandida com calendário de check-ins

### 2.2 Check-in com Foto/Métrica

**Arquivos**:
```
src/app/patient/challenges/_components/goal-checkin-form.tsx (novo)
src/app/patient/challenges/_components/photo-upload.tsx (novo)
src/app/patient/challenges/_components/metric-input.tsx (novo)
```

**Fluxo de check-in**:

1. Paciente clica "Fazer check-in"
2. Modal abre com campos baseados no tipo da meta:
   - `checkin`: Só botão de confirmar + campo de notas opcional
   - `photo`: Upload de foto + notas
   - `metric`: Input numérico + notas (pré-preenche se existir medição do dia)
3. Validação e salvamento
4. Animação de sucesso
5. Verificar se conquistou achievement (streak 7/14/21)

### 2.3 Integração com Measurements

**Lógica para tipo `metric`**:

```typescript
async function getMetricValue(patientId: string, metricType: MetricType, date: string) {
  // Tenta buscar medição do dia
  const { data } = await supabase
    .from('measurements')
    .select('*')
    .eq('patient_id', patientId)
    .eq('measurement_date', date)
    .single();

  if (data) {
    const fieldMap = {
      weight: 'weight',
      waist: 'waist_circumference',
      hip: 'hip_circumference',
      body_fat: 'body_fat_percentage',
      water: null // não existe em measurements
    };

    const field = fieldMap[metricType];
    if (field && data[field]) {
      return data[field];
    }
  }

  return null; // Paciente precisa registrar
}
```

### 2.4 Conquistas e Streaks

**Arquivo**: `src/app/patient/challenges/_components/achievements-display.tsx`

**Lógica de streak** (rodar após cada check-in):

```typescript
async function updateStreak(participantId: string, goalId: string) {
  const { data: checkins } = await supabase
    .from('goal_checkins')
    .select('checkin_date')
    .eq('participant_id', participantId)
    .eq('goal_id', goalId)
    .order('checkin_date', { ascending: false });

  // Calcula streak atual (dias consecutivos)
  let streak = 0;
  let expectedDate = new Date();

  for (const checkin of checkins) {
    const checkinDate = new Date(checkin.checkin_date);
    if (isSameDay(checkinDate, expectedDate)) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Atualiza participant
  await supabase
    .from('challenge_participants')
    .update({
      streak_count: streak,
      best_streak: Math.max(streak, participant.best_streak)
    })
    .eq('id', participantId);

  // Verifica achievements
  const achievementThresholds = [7, 14, 21];
  for (const threshold of achievementThresholds) {
    if (streak >= threshold) {
      await createAchievementIfNotExists(participantId, goalId, `streak_${threshold}`);
    }
  }
}
```

### 2.5 Progressão de Fase

**Lógica para verificar se passou de fase**:

```typescript
async function checkPhaseCompletion(participantId: string, phaseId: string) {
  const phase = await getPhase(phaseId);
  const goals = await getPhaseGoals(phaseId);

  const completedGoals = goals.filter(g => isGoalCompleted(participantId, g.id));
  const completionRate = (completedGoals.length / goals.length) * 100;

  if (completionRate >= phase.completion_threshold) {
    // Marca fase como completa
    await supabase
      .from('challenge_phases')
      .update({ status: 'completed' })
      .eq('id', phaseId);

    // Desbloqueia próxima fase
    const nextPhase = await getNextPhase(phase.challenge_id, phase.order_index);
    if (nextPhase) {
      await supabase
        .from('challenge_phases')
        .update({ status: 'active' })
        .eq('id', nextPhase.id);

      // Atualiza participante
      await supabase
        .from('challenge_participants')
        .update({ current_phase_id: nextPhase.id })
        .eq('id', participantId);
    }

    // Cria achievement de fase
    await createAchievement(participantId, null, phaseId, 'phase_complete');
  }
}
```

---

## Sprint 3: Polish

### 3.1 Compressão de Imagens

**Biblioteca**: `browser-image-compression`

```typescript
import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Comprimir para max 1MB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  const compressedFile = await imageCompression(file, options);
  return compressedFile;
}
```

### 3.2 Templates Pré-definidos

**Arquivo**: `src/lib/challenge-templates.ts`

```typescript
export const CHALLENGE_TEMPLATES = {
  habit_21: {
    name: "21 Dias de Hábito",
    description: "Desafio simples de check-in diário para formar um hábito",
    phases: [],
    goals: [
      {
        title: "Check-in diário",
        type: "checkin",
        duration_days: 21,
      }
    ]
  },

  photo_diary: {
    name: "Diário Alimentar Fotográfico",
    description: "Registre suas refeições com fotos por 14 dias",
    phases: [],
    goals: [
      {
        title: "Foto do café da manhã",
        type: "photo",
        duration_days: 14,
      },
      {
        title: "Foto do almoço",
        type: "photo",
        duration_days: 14,
      },
      {
        title: "Foto do jantar",
        type: "photo",
        duration_days: 14,
      }
    ]
  },

  weight_control: {
    name: "Controle de Peso Semanal",
    description: "Registre seu peso uma vez por semana durante 8 semanas",
    phases: [],
    goals: [
      {
        title: "Registro de peso",
        type: "metric",
        metric_type: "weight",
        duration_days: 56, // 8 semanas
        settings: {
          frequency: "weekly" // check-in só 1x por semana
        }
      }
    ]
  }
};
```

### 3.3 Animações de Conquista

**Componentes**:
- Confetti animation ao ganhar badge
- Modal de celebração com animação
- Sound effect opcional

### 3.4 Notificações (Futuro)

- Push notification de lembrete diário
- Notificação quando desbloquear nova fase
- Notificação de streak prestes a quebrar

---

## Checklist de Implementação

### Sprint 1
- [ ] Criar migration com novas tabelas
- [ ] Adicionar types no database.ts
- [ ] Criar bucket no Supabase Storage
- [ ] Atualizar formulário de criação de desafio
- [ ] Componente PhaseBuilder
- [ ] Componente GoalForm
- [ ] Testar criação de desafio com fases e metas

### Sprint 2
- [ ] Atualizar página de desafio do paciente
- [ ] Componente de check-in com tipos
- [ ] Upload de foto com preview
- [ ] Input de métrica com integração measurements
- [ ] Lógica de streak
- [ ] Sistema de achievements
- [ ] Lógica de progressão de fase
- [ ] Testar fluxo completo do paciente

### Sprint 3
- [ ] Instalar e configurar compressão de imagem
- [ ] Implementar templates
- [ ] Animações de conquista
- [ ] Testes E2E
- [ ] Documentação

---

## Considerações Técnicas

### Performance
- Usar `useMemo` para cálculos de progresso
- Lazy load das imagens de check-in
- Pagination para histórico de check-ins

### Segurança
- Validar tamanho de arquivo no cliente E servidor
- RLS para todas as tabelas
- Sanitizar URLs de imagem

### UX
- Loading states para uploads
- Feedback visual claro de progresso
- Confirmação antes de ações destrutivas

### Migração de Dados
- Desafios existentes continuam funcionando (backward compatible)
- Migrar gradualmente para novo formato se necessário
