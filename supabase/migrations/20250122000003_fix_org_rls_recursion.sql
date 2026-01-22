-- =============================================
-- Fix RLS Infinite Recursion for organization_members
-- =============================================

-- Drop existing problematic policies
drop policy if exists "Members can view org members" on organization_members;
drop policy if exists "Admins can insert members" on organization_members;
drop policy if exists "Admins can update members" on organization_members;
drop policy if exists "Admins can delete members" on organization_members;

drop policy if exists "Admins can view invites" on organization_invites;
drop policy if exists "Admins can create invites" on organization_invites;
drop policy if exists "Admins can delete invites" on organization_invites;

drop policy if exists "Members can view their organizations" on organizations;
drop policy if exists "Admins can update organizations" on organizations;

drop policy if exists "Admins can view org appointments" on appointments;

-- =============================================
-- Create SECURITY DEFINER functions to avoid recursion
-- =============================================

-- Function to get user's organization IDs (bypasses RLS)
create or replace function get_user_org_ids()
returns setof uuid as $$
begin
  return query
  select organization_id
  from organization_members
  where user_id = auth.uid() and status = 'active';
end;
$$ language plpgsql security definer stable;

-- Function to get user's admin organization IDs (bypasses RLS)
create or replace function get_user_admin_org_ids()
returns setof uuid as $$
begin
  return query
  select organization_id
  from organization_members
  where user_id = auth.uid() and role = 'admin' and status = 'active'
  union
  select id from organizations where owner_id = auth.uid();
end;
$$ language plpgsql security definer stable;

-- Function to check if user is owner of any org where org_id matches
create or replace function is_org_owner(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from organizations where id = org_id and owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable;

-- =============================================
-- Recreate Organizations Policies (using functions)
-- =============================================

create policy "Members can view their organizations"
  on organizations for select
  using (
    id in (select get_user_org_ids())
    or owner_id = auth.uid()
  );

create policy "Admins can update organizations"
  on organizations for update
  using (
    owner_id = auth.uid()
    or id in (select get_user_admin_org_ids())
  );

-- =============================================
-- Recreate Organization Members Policies (using functions)
-- =============================================

-- SELECT: Members can view other members in their organizations
create policy "Members can view org members"
  on organization_members for select
  using (
    organization_id in (select get_user_org_ids())
    or user_id = auth.uid()
  );

-- INSERT: Admins/owners can add members
create policy "Admins can insert members"
  on organization_members for insert
  with check (
    organization_id in (select get_user_admin_org_ids())
  );

-- UPDATE: Admins/owners can update, or user updating own record
create policy "Admins can update members"
  on organization_members for update
  using (
    organization_id in (select get_user_admin_org_ids())
    or user_id = auth.uid()
  );

-- DELETE: Admins/owners can delete
create policy "Admins can delete members"
  on organization_members for delete
  using (
    organization_id in (select get_user_admin_org_ids())
  );

-- =============================================
-- Recreate Organization Invites Policies (using functions)
-- =============================================

create policy "Admins can view invites"
  on organization_invites for select
  using (
    organization_id in (select get_user_admin_org_ids())
  );

create policy "Admins can create invites"
  on organization_invites for insert
  with check (
    organization_id in (select get_user_admin_org_ids())
  );

create policy "Admins can update invites"
  on organization_invites for update
  using (
    organization_id in (select get_user_admin_org_ids())
  );

create policy "Admins can delete invites"
  on organization_invites for delete
  using (
    organization_id in (select get_user_admin_org_ids())
  );

-- =============================================
-- Recreate Appointments Policy (using functions)
-- =============================================

-- Drop and recreate to avoid conflicts
drop policy if exists "Admins can view org appointments" on appointments;

create policy "Admins can view org appointments"
  on appointments for select
  using (
    organization_id in (select get_user_admin_org_ids())
  );
