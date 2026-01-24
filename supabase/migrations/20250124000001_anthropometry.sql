-- Anthropometry Assessments table for detailed body composition tracking
-- Includes skinfolds (7 points), circumferences (13 fields), and calculated metrics

create table anthropometry_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  assessed_at timestamptz not null default now(),

  -- Basic measurements
  weight numeric(5,2),
  height numeric(5,2),

  -- Skinfolds (dobras cutaneas) in mm
  triceps_skinfold numeric(5,2),
  subscapular_skinfold numeric(5,2),
  suprailiac_skinfold numeric(5,2),
  abdominal_skinfold numeric(5,2),
  thigh_skinfold numeric(5,2),
  chest_skinfold numeric(5,2),
  midaxillary_skinfold numeric(5,2),

  -- Circumferences (circunferencias) in cm
  neck_circumference numeric(5,2),
  chest_circumference numeric(5,2),
  waist_circumference numeric(5,2),
  abdomen_circumference numeric(5,2),
  hip_circumference numeric(5,2),
  right_arm_circumference numeric(5,2),
  left_arm_circumference numeric(5,2),
  right_forearm_circumference numeric(5,2),
  left_forearm_circumference numeric(5,2),
  right_thigh_circumference numeric(5,2),
  left_thigh_circumference numeric(5,2),
  right_calf_circumference numeric(5,2),
  left_calf_circumference numeric(5,2),

  -- Calculated fields (stored for historical reference)
  bmi numeric(5,2),
  body_fat_percentage numeric(5,2),
  waist_hip_ratio numeric(5,3),
  calculation_protocol text,

  -- Metadata
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_anthropometry_patient_id on anthropometry_assessments(patient_id);
create index idx_anthropometry_assessed_at on anthropometry_assessments(assessed_at);

-- Enable RLS
alter table anthropometry_assessments enable row level security;

-- ============================================
-- ANTHROPOMETRY_ASSESSMENTS RLS POLICIES
-- ============================================

-- Nutris can view anthropometry assessments of their patients
create policy "Nutris can view patient anthropometry"
  on anthropometry_assessments for select
  using (
    exists (
      select 1 from patients
      where patients.id = anthropometry_assessments.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Patients can view their own anthropometry assessments
create policy "Patients can view own anthropometry"
  on anthropometry_assessments for select
  using (
    exists (
      select 1 from patients
      where patients.id = anthropometry_assessments.patient_id
      and patients.profile_id = auth.uid()
    )
  );

-- Nutris can create anthropometry assessments for their patients
create policy "Nutris can create anthropometry"
  on anthropometry_assessments for insert
  with check (
    exists (
      select 1 from patients
      where patients.id = patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can update anthropometry assessments of their patients
create policy "Nutris can update patient anthropometry"
  on anthropometry_assessments for update
  using (
    exists (
      select 1 from patients
      where patients.id = anthropometry_assessments.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can delete anthropometry assessments of their patients
create policy "Nutris can delete patient anthropometry"
  on anthropometry_assessments for delete
  using (
    exists (
      select 1 from patients
      where patients.id = anthropometry_assessments.patient_id
      and patients.nutri_id = auth.uid()
    )
  );
