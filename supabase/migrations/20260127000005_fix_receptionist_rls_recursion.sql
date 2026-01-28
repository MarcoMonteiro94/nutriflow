-- =============================================
-- Fix Receptionist RLS Recursion
-- Addresses infinite recursion in patients table policies
-- =============================================

-- =============================================
-- Step 1: Drop problematic policies
-- =============================================

-- Drop profiles policy that causes recursion (references patients table)
drop policy if exists "Receptionists can view org profiles" on profiles;

-- =============================================
-- Step 2: Create helper functions with SECURITY DEFINER
-- These functions bypass RLS to prevent recursion
-- =============================================

-- Function to get patient user_ids for org members (bypasses patients RLS)
-- This is needed for profiles policy without triggering patients RLS
create or replace function get_org_patient_user_ids()
returns setof uuid as $$
begin
  return query
  select p.user_id
  from patients p
  where p.nutri_id in (
    -- Inline the nutri IDs query to avoid function call chains
    select om.user_id
    from organization_members om
    inner join organization_members my_orgs
      on my_orgs.organization_id = om.organization_id
    where my_orgs.user_id = auth.uid()
      and my_orgs.status = 'active'
      and om.role in ('admin', 'nutri')
      and om.status = 'active'
    union
    select o.owner_id
    from organizations o
    inner join organization_members my_orgs
      on my_orgs.organization_id = o.id
    where my_orgs.user_id = auth.uid()
      and my_orgs.status = 'active'
  )
  and p.user_id is not null;
end;
$$ language plpgsql security definer stable;

-- Function to check if a given nutri_id belongs to user's organization
-- This is simpler and avoids complex function chains
create or replace function is_nutri_in_my_org(target_nutri_id uuid)
returns boolean as $$
begin
  return exists (
    -- Check if target nutri is in an org where current user is a member
    select 1
    from organization_members om_nutri
    inner join organization_members om_me
      on om_nutri.organization_id = om_me.organization_id
    where om_nutri.user_id = target_nutri_id
      and om_nutri.status = 'active'
      and om_nutri.role in ('admin', 'nutri')
      and om_me.user_id = auth.uid()
      and om_me.status = 'active'
  )
  or exists (
    -- Check if target nutri is owner of an org where current user is a member
    select 1
    from organizations o
    inner join organization_members om_me on o.id = om_me.organization_id
    where o.owner_id = target_nutri_id
      and om_me.user_id = auth.uid()
      and om_me.status = 'active'
  );
end;
$$ language plpgsql security definer stable;

-- =============================================
-- Step 3: Drop and recreate patients policies with simpler logic
-- =============================================

-- Drop existing receptionist policies on patients
drop policy if exists "Receptionists can view org patients" on patients;
drop policy if exists "Receptionists can create org patients" on patients;
drop policy if exists "Receptionists can update org patients" on patients;

-- Recreate with simpler, non-recursive logic
create policy "Receptionists can view org patients"
  on patients for select
  using (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );

create policy "Receptionists can create org patients"
  on patients for insert
  with check (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );

create policy "Receptionists can update org patients"
  on patients for update
  using (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );

-- =============================================
-- Step 4: Recreate profiles policy without referencing patients table directly
-- =============================================

create policy "Receptionists can view org profiles"
  on profiles for select
  using (
    -- Can view profiles of org members
    id in (
      select om.user_id
      from organization_members om
      inner join organization_members my_orgs
        on my_orgs.organization_id = om.organization_id
      where my_orgs.user_id = auth.uid()
        and my_orgs.status = 'active'
        and om.status = 'active'
    )
    -- Can view profiles of patients (using SECURITY DEFINER function)
    or id in (select get_org_patient_user_ids())
  );

-- =============================================
-- Step 5: Update other policies that use get_org_nutri_ids()
-- =============================================

-- Drop and recreate appointments policies
drop policy if exists "Receptionists can view org appointments" on appointments;
drop policy if exists "Receptionists can create org appointments" on appointments;
drop policy if exists "Receptionists can update org appointments" on appointments;
drop policy if exists "Receptionists can delete org appointments" on appointments;

create policy "Receptionists can view org appointments"
  on appointments for select
  using (
    is_receptionist()
    and (
      organization_id in (select get_user_receptionist_org_ids())
      or is_nutri_in_my_org(nutri_id)
    )
  );

create policy "Receptionists can create org appointments"
  on appointments for insert
  with check (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );

create policy "Receptionists can update org appointments"
  on appointments for update
  using (
    is_receptionist()
    and (
      organization_id in (select get_user_receptionist_org_ids())
      or is_nutri_in_my_org(nutri_id)
    )
  );

create policy "Receptionists can delete org appointments"
  on appointments for delete
  using (
    is_receptionist()
    and (
      organization_id in (select get_user_receptionist_org_ids())
      or is_nutri_in_my_org(nutri_id)
    )
  );

-- Drop and recreate measurements policy
drop policy if exists "Receptionists can view org measurements" on measurements;

create policy "Receptionists can view org measurements"
  on measurements for select
  using (
    is_receptionist()
    and exists (
      select 1 from patients p
      where p.id = patient_id
      and is_nutri_in_my_org(p.nutri_id)
    )
  );

-- Drop and recreate meal_plans policy
drop policy if exists "Receptionists can view org meal plans" on meal_plans;

create policy "Receptionists can view org meal plans"
  on meal_plans for select
  using (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );

-- Drop and recreate anamnesis policy
drop policy if exists "Receptionists can view org anamnesis" on anamnesis_reports;

create policy "Receptionists can view org anamnesis"
  on anamnesis_reports for select
  using (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );

