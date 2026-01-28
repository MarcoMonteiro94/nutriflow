-- =============================================
-- Receptionist RLS Policies
-- Allows receptionists to view/manage patients and appointments
-- within their organization
-- =============================================

-- =============================================
-- Helper Functions
-- =============================================

-- Function to get organization IDs where user is a receptionist
create or replace function get_user_receptionist_org_ids()
returns setof uuid as $$
begin
  return query
  select organization_id
  from organization_members
  where user_id = auth.uid()
    and role = 'receptionist'
    and status = 'active';
end;
$$ language plpgsql security definer stable;

-- Function to get nutri IDs within user's organization
-- (for receptionists to access patients of nutris in same org)
create or replace function get_org_nutri_ids()
returns setof uuid as $$
begin
  return query
  select om.user_id
  from organization_members om
  where om.organization_id in (select get_user_org_ids())
    and om.role in ('admin', 'nutri')
    and om.status = 'active'
  union
  -- Include organization owners
  select o.owner_id
  from organizations o
  where o.id in (select get_user_org_ids());
end;
$$ language plpgsql security definer stable;

-- Function to check if user is receptionist in any org
create or replace function is_receptionist()
returns boolean as $$
begin
  return exists (
    select 1
    from organization_members
    where user_id = auth.uid()
      and role = 'receptionist'
      and status = 'active'
  );
end;
$$ language plpgsql security definer stable;

-- =============================================
-- Patients Table - Receptionist Policies
-- =============================================

-- Receptionists can view patients of nutris in their organization
create policy "Receptionists can view org patients"
  on patients for select
  using (
    nutri_id in (select get_org_nutri_ids())
    and is_receptionist()
  );

-- Receptionists can create patients for nutris in their organization
create policy "Receptionists can create org patients"
  on patients for insert
  with check (
    nutri_id in (select get_org_nutri_ids())
    and is_receptionist()
  );

-- Receptionists can update patients of nutris in their organization
create policy "Receptionists can update org patients"
  on patients for update
  using (
    nutri_id in (select get_org_nutri_ids())
    and is_receptionist()
  );

-- =============================================
-- Appointments Table - Receptionist Policies
-- =============================================

-- Receptionists can view appointments in their organization
create policy "Receptionists can view org appointments"
  on appointments for select
  using (
    (
      organization_id in (select get_user_receptionist_org_ids())
      or nutri_id in (select get_org_nutri_ids())
    )
    and is_receptionist()
  );

-- Receptionists can create appointments for nutris in their organization
create policy "Receptionists can create org appointments"
  on appointments for insert
  with check (
    nutri_id in (select get_org_nutri_ids())
    and is_receptionist()
  );

-- Receptionists can update appointments in their organization
create policy "Receptionists can update org appointments"
  on appointments for update
  using (
    (
      organization_id in (select get_user_receptionist_org_ids())
      or nutri_id in (select get_org_nutri_ids())
    )
    and is_receptionist()
  );

-- Receptionists can delete appointments in their organization
create policy "Receptionists can delete org appointments"
  on appointments for delete
  using (
    (
      organization_id in (select get_user_receptionist_org_ids())
      or nutri_id in (select get_org_nutri_ids())
    )
    and is_receptionist()
  );

-- =============================================
-- Measurements Table - Receptionist Read Access
-- =============================================

-- Receptionists can view measurements of patients in their organization
create policy "Receptionists can view org measurements"
  on measurements for select
  using (
    exists (
      select 1 from patients
      where patients.id = measurements.patient_id
      and patients.nutri_id in (select get_org_nutri_ids())
    )
    and is_receptionist()
  );

-- =============================================
-- Meal Plans Table - Receptionist Read Access
-- =============================================

-- Receptionists can view meal plans in their organization
create policy "Receptionists can view org meal plans"
  on meal_plans for select
  using (
    nutri_id in (select get_org_nutri_ids())
    and is_receptionist()
  );

-- =============================================
-- Anamnesis Reports Table - Receptionist Read Access
-- =============================================

-- Receptionists can view anamnesis reports in their organization
create policy "Receptionists can view org anamnesis"
  on anamnesis_reports for select
  using (
    nutri_id in (select get_org_nutri_ids())
    and is_receptionist()
  );

-- =============================================
-- Profiles Table - Receptionist Read Access
-- =============================================

-- Receptionists can view profiles of org members and patients
create policy "Receptionists can view org profiles"
  on profiles for select
  using (
    id in (
      select user_id from organization_members
      where organization_id in (select get_user_org_ids())
      and status = 'active'
    )
    or id in (
      select user_id from patients
      where nutri_id in (select get_org_nutri_ids())
      and user_id is not null
    )
  );
