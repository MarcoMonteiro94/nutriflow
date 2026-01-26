-- NutriFlow Custom Measurements Migration
-- Creates tables for user-defined measurement types and their values

-- Custom measurement types table (nutritionist-defined metrics)
CREATE TABLE custom_measurement_types (
  id uuid primary key default gen_random_uuid(),
  nutri_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  unit text not null,
  category text,
  created_at timestamptz not null default now()
);

-- Custom measurement values table (actual measurements)
CREATE TABLE custom_measurement_values (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  type_id uuid not null references custom_measurement_types(id) on delete cascade,
  value numeric(10,2) not null,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Create indexes for common queries
create index idx_custom_measurement_types_nutri_id on custom_measurement_types(nutri_id);
create index idx_custom_measurement_values_patient_id on custom_measurement_values(patient_id);
create index idx_custom_measurement_values_type_id on custom_measurement_values(type_id);
create index idx_custom_measurement_values_measured_at on custom_measurement_values(measured_at);

-- Enable Row Level Security
alter table custom_measurement_types enable row level security;
alter table custom_measurement_values enable row level security;

-- RLS Policies for custom_measurement_types
-- Nutritionists can manage their own custom measurement types
create policy "Nutritionists can view their own custom measurement types"
  on custom_measurement_types for select
  using (auth.uid() = nutri_id);

create policy "Nutritionists can create their own custom measurement types"
  on custom_measurement_types for insert
  with check (auth.uid() = nutri_id);

create policy "Nutritionists can update their own custom measurement types"
  on custom_measurement_types for update
  using (auth.uid() = nutri_id);

create policy "Nutritionists can delete their own custom measurement types"
  on custom_measurement_types for delete
  using (auth.uid() = nutri_id);

-- RLS Policies for custom_measurement_values
-- Nutritionists can manage custom measurements for their patients
create policy "Nutritionists can view custom measurements for their patients"
  on custom_measurement_values for select
  using (
    exists (
      select 1 from patients
      where patients.id = custom_measurement_values.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

create policy "Nutritionists can create custom measurements for their patients"
  on custom_measurement_values for insert
  with check (
    exists (
      select 1 from patients
      where patients.id = custom_measurement_values.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

create policy "Nutritionists can update custom measurements for their patients"
  on custom_measurement_values for update
  using (
    exists (
      select 1 from patients
      where patients.id = custom_measurement_values.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

create policy "Nutritionists can delete custom measurements for their patients"
  on custom_measurement_values for delete
  using (
    exists (
      select 1 from patients
      where patients.id = custom_measurement_values.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Patients can view their own custom measurements (for patient portal)
create policy "Patients can view their own custom measurements"
  on custom_measurement_values for select
  using (
    exists (
      select 1 from patients
      where patients.id = custom_measurement_values.patient_id
      and patients.profile_id = auth.uid()
    )
  );
