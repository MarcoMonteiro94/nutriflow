-- Fix #23: Add organization_id to patients table for data integrity
-- Currently patients are linked to orgs only indirectly via nutri_id → organization_members.
-- This adds an explicit organization_id column and a trigger to keep it in sync.

-- Step 1: Add organization_id column (nullable initially for backfill)
alter table patients
  add column if not exists organization_id uuid references organizations(id) on delete set null;

-- Step 2: Backfill organization_id from nutri's organization
update patients p
set organization_id = (
  select om.organization_id
  from organization_members om
  where om.user_id = p.nutri_id
    and om.status = 'active'
    and om.role in ('admin', 'nutri')
  limit 1
)
where p.organization_id is null;

-- Also check if nutri is the owner of an org (not necessarily in members table)
update patients p
set organization_id = (
  select o.id
  from organizations o
  where o.owner_id = p.nutri_id
  limit 1
)
where p.organization_id is null;

-- Step 3: Create index for performance
create index if not exists idx_patients_organization_id on patients(organization_id);

-- Step 4: Create trigger function to auto-set organization_id on insert/update
create or replace function set_patient_organization_id()
returns trigger as $$
declare
  org_id uuid;
begin
  -- Find organization from nutri's membership
  select om.organization_id into org_id
  from organization_members om
  where om.user_id = NEW.nutri_id
    and om.status = 'active'
    and om.role in ('admin', 'nutri')
  limit 1;

  -- Fallback: check if nutri owns an organization
  if org_id is null then
    select o.id into org_id
    from organizations o
    where o.owner_id = NEW.nutri_id
    limit 1;
  end if;

  NEW.organization_id := org_id;
  return NEW;
end;
$$ language plpgsql security definer;

-- Step 5: Attach trigger
drop trigger if exists trg_set_patient_org on patients;
create trigger trg_set_patient_org
  before insert or update of nutri_id on patients
  for each row
  execute function set_patient_organization_id();

-- Step 6: Add RLS policy for org-scoped patient access
-- Receptionists and other org members can view patients in their org
create policy "Org members can view org patients"
  on patients for select
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
  );
