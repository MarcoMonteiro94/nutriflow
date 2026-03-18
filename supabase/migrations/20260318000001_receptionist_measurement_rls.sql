-- Fix #16: Grant receptionists read access to measurement-related tables
-- Receptionists need SELECT access to view data of patients in their organization.
-- Uses the same helper functions from 20260127000004_receptionist_rls.sql:
--   is_receptionist() and is_nutri_in_my_org(target_nutri_id)

-- Receptionists can view anthropometry assessments of patients in their organization
create policy "Receptionists can view org anthropometry"
  on anthropometry_assessments for select
  using (
    is_receptionist()
    and exists (
      select 1 from patients p
      where p.id = anthropometry_assessments.patient_id
      and is_nutri_in_my_org(p.nutri_id)
    )
  );

-- Receptionists can view measurement goals of patients in their organization
create policy "Receptionists can view org measurement goals"
  on measurement_goals for select
  using (
    is_receptionist()
    and exists (
      select 1 from patients p
      where p.id = measurement_goals.patient_id
      and is_nutri_in_my_org(p.nutri_id)
    )
  );

-- Receptionists can view measurement photos of patients in their organization
create policy "Receptionists can view org measurement photos"
  on measurement_photos for select
  using (
    is_receptionist()
    and exists (
      select 1 from patients p
      where p.id = measurement_photos.patient_id
      and is_nutri_in_my_org(p.nutri_id)
    )
  );

-- Receptionists can view custom measurement types from nutris in their organization
create policy "Receptionists can view org custom measurement types"
  on custom_measurement_types for select
  using (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );

-- Receptionists can view custom measurement values of patients in their organization
create policy "Receptionists can view org custom measurement values"
  on custom_measurement_values for select
  using (
    is_receptionist()
    and exists (
      select 1 from patients p
      where p.id = custom_measurement_values.patient_id
      and is_nutri_in_my_org(p.nutri_id)
    )
  );
