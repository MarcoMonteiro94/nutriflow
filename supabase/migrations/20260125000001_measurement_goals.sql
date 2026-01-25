-- Measurement Goals table for tracking patient progress targets
-- Allows nutritionists to set specific goals for various metrics (weight, body fat, etc.)

CREATE TABLE measurement_goals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  metric_type text not null,
  target_value numeric(8,2) not null,
  target_date date,
  current_value numeric(8,2),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_measurement_goals_patient_id on measurement_goals(patient_id);
create index idx_measurement_goals_is_active on measurement_goals(is_active);
create index idx_measurement_goals_target_date on measurement_goals(target_date);

-- Enable RLS
alter table measurement_goals enable row level security;

-- Apply updated_at trigger
create trigger update_measurement_goals_updated_at
  before update on measurement_goals
  for each row execute function update_updated_at_column();

-- ============================================
-- MEASUREMENT_GOALS RLS POLICIES
-- ============================================

-- Nutris can view measurement goals of their patients
create policy "Nutris can view patient measurement goals"
  on measurement_goals for select
  using (
    exists (
      select 1 from patients
      where patients.id = measurement_goals.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Patients can view their own measurement goals
create policy "Patients can view own measurement goals"
  on measurement_goals for select
  using (
    exists (
      select 1 from patients
      where patients.id = measurement_goals.patient_id
      and patients.profile_id = auth.uid()
    )
  );

-- Nutris can create measurement goals for their patients
create policy "Nutris can create measurement goals"
  on measurement_goals for insert
  with check (
    exists (
      select 1 from patients
      where patients.id = patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can update measurement goals of their patients
create policy "Nutris can update patient measurement goals"
  on measurement_goals for update
  using (
    exists (
      select 1 from patients
      where patients.id = measurement_goals.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can delete measurement goals of their patients
create policy "Nutris can delete patient measurement goals"
  on measurement_goals for delete
  using (
    exists (
      select 1 from patients
      where patients.id = measurement_goals.patient_id
      and patients.nutri_id = auth.uid()
    )
  );
