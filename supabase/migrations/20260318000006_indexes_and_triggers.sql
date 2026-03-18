-- Issue #69: Add missing indexes and updated_at triggers

-- ============================================================
-- INDEXES for frequently filtered/sorted columns
-- ============================================================

-- appointments: range queries by date
create index if not exists idx_appointments_scheduled_at on appointments(scheduled_at);

-- measurements: filtered by patient
create index if not exists idx_measurements_patient_id on measurements(patient_id);
create index if not exists idx_measurements_measured_at on measurements(measured_at);

-- anthropometry: filtered by patient and date
create index if not exists idx_anthropometry_patient_id on anthropometry_assessments(patient_id);

-- anamnesis: filtered by patient and status
create index if not exists idx_anamnesis_patient_id on anamnesis_reports(patient_id);
create index if not exists idx_anamnesis_status on anamnesis_reports(status);

-- meal_plans: filtered by patient
create index if not exists idx_meal_plans_patient_id on meal_plans(patient_id);
create index if not exists idx_meal_plans_status on meal_plans(status);

-- organization_members: frequently joined
create index if not exists idx_org_members_user_id on organization_members(user_id);

-- ============================================================
-- UPDATED_AT trigger function (reusable)
-- ============================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Apply to tables that have updated_at but no trigger
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'patients',
      'appointments',
      'meal_plans',
      'measurements',
      'anthropometry_assessments',
      'anamnesis_reports',
      'organizations',
      'organization_members'
    ])
  loop
    -- Check if trigger already exists before creating
    if not exists (
      select 1 from pg_trigger
      where tgname = 'trg_updated_at_' || tbl
      and tgrelid = tbl::regclass
    ) then
      execute format(
        'create trigger trg_updated_at_%I
         before update on %I
         for each row
         execute function update_updated_at_column()',
        tbl, tbl
      );
    end if;
  end loop;
end;
$$;
