-- Issue #57: Audit logging for sensitive operations

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb default '{}',
  ip_address text,
  created_at timestamptz not null default now()
);

-- Index for querying by user and action
create index idx_audit_logs_user_id on audit_logs(user_id);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_resource on audit_logs(resource_type, resource_id);
create index idx_audit_logs_created_at on audit_logs(created_at);

-- RLS: only admins/owners can read audit logs
alter table audit_logs enable row level security;

create policy "Admins can view org audit logs"
  on audit_logs for select
  using (
    exists (
      select 1 from organization_members om
      where om.user_id = auth.uid()
        and om.role = 'admin'
        and om.status = 'active'
    )
  );

-- Insert policy: any authenticated user can create audit entries
create policy "Authenticated users can create audit logs"
  on audit_logs for insert
  with check (auth.uid() is not null);
