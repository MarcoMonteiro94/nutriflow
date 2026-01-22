-- =============================================
-- Phase 3: Multi-tenant Organizations (Clínicas)
-- =============================================

-- Organizations (Clínicas)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  slug varchar(100) unique not null,
  logo_url text,
  settings jsonb default '{}',
  owner_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Organization Members
create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role varchar(20) not null default 'nutri' check (role in ('admin', 'nutri', 'receptionist')),
  invited_by uuid references profiles(id),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  status varchar(20) not null default 'active' check (status in ('pending', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, user_id)
);

-- Organization Invites (for pending invites by email)
create table organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email varchar(255) not null,
  role varchar(20) not null default 'nutri' check (role in ('admin', 'nutri', 'receptionist')),
  invited_by uuid not null references profiles(id),
  token varchar(100) unique not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),

  unique (organization_id, email)
);

-- Add organization_id to appointments (optional - for consolidated view)
alter table appointments
  add column organization_id uuid references organizations(id) on delete set null;

-- Indexes for performance
create index idx_organizations_slug on organizations(slug);
create index idx_organizations_owner on organizations(owner_id);
create index idx_org_members_org on organization_members(organization_id);
create index idx_org_members_user on organization_members(user_id);
create index idx_org_members_status on organization_members(status);
create index idx_org_invites_org on organization_invites(organization_id);
create index idx_org_invites_email on organization_invites(email);
create index idx_org_invites_token on organization_invites(token);
create index idx_appointments_org on appointments(organization_id);

-- Updated_at triggers
create trigger update_organizations_updated_at
  before update on organizations
  for each row
  execute function update_anamnesis_reports_updated_at();

create trigger update_organization_members_updated_at
  before update on organization_members
  for each row
  execute function update_anamnesis_reports_updated_at();

-- =============================================
-- RLS Policies
-- =============================================

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_invites enable row level security;

-- Organizations: Members can view their organizations
create policy "Members can view their organizations"
  on organizations for select
  using (
    id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and status = 'active'
    )
    or owner_id = auth.uid()
  );

-- Organizations: Only owner can create
create policy "Users can create organizations"
  on organizations for insert
  with check (owner_id = auth.uid());

-- Organizations: Only admin/owner can update
create policy "Admins can update organizations"
  on organizations for update
  using (
    owner_id = auth.uid()
    or id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'admin' and status = 'active'
    )
  );

-- Organizations: Only owner can delete
create policy "Owner can delete organization"
  on organizations for delete
  using (owner_id = auth.uid());

-- Organization Members: Members can view other members in their org
create policy "Members can view org members"
  on organization_members for select
  using (
    organization_id in (
      select organization_id
      from organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
    or user_id = auth.uid()
  );

-- Organization Members: Admins can manage members
create policy "Admins can insert members"
  on organization_members for insert
  with check (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'admin' and status = 'active'
    )
    or organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

create policy "Admins can update members"
  on organization_members for update
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'admin' and status = 'active'
    )
    or organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
    or user_id = auth.uid() -- Users can update their own membership (e.g., accept invite)
  );

create policy "Admins can delete members"
  on organization_members for delete
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'admin' and status = 'active'
    )
    or organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

-- Organization Invites: Admins can manage invites
create policy "Admins can view invites"
  on organization_invites for select
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'admin' and status = 'active'
    )
    or organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

create policy "Admins can create invites"
  on organization_invites for insert
  with check (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'admin' and status = 'active'
    )
    or organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

create policy "Admins can delete invites"
  on organization_invites for delete
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'admin' and status = 'active'
    )
    or organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

-- Appointments: Admins can view all org appointments
create policy "Admins can view org appointments"
  on appointments for select
  using (
    organization_id in (
      select organization_id
      from organization_members
      where user_id = auth.uid() and role = 'admin' and status = 'active'
    )
  );

-- =============================================
-- Helper Functions
-- =============================================

-- Function to check if user is admin of an organization
create or replace function is_org_admin(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
  ) or exists (
    select 1
    from organizations
    where id = org_id
      and owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Function to check if user is member of an organization
create or replace function is_org_member(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and status = 'active'
  );
end;
$$ language plpgsql security definer;

-- Function to get user's organizations
create or replace function get_user_organizations()
returns setof organizations as $$
begin
  return query
  select o.*
  from organizations o
  where o.owner_id = auth.uid()
     or o.id in (
       select organization_id
       from organization_members
       where user_id = auth.uid() and status = 'active'
     );
end;
$$ language plpgsql security definer;
