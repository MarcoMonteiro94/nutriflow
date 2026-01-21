-- NutriFlow Phase 1: Advanced Scheduling Migration
-- Creates tables for availability, time blocks, and appointment history

-- Create block_type enum
create type block_type as enum ('personal', 'holiday', 'vacation', 'other');

-- Create appointment_action enum for history tracking
create type appointment_action as enum ('created', 'rescheduled', 'cancelled', 'completed', 'no_show');

-- =============================================================================
-- Table: nutri_availability
-- Weekly recurring availability slots for nutritionists
-- =============================================================================
create table nutri_availability (
  id uuid primary key default gen_random_uuid(),
  nutri_id uuid references auth.users(id) on delete cascade not null,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=domingo, 6=sábado
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint valid_time_range check (start_time < end_time),
  constraint unique_availability_slot unique (nutri_id, day_of_week, start_time)
);

comment on table nutri_availability is 'Weekly recurring availability slots for nutritionists';
comment on column nutri_availability.day_of_week is '0=Sunday, 1=Monday, ..., 6=Saturday';

-- =============================================================================
-- Table: nutri_time_blocks
-- Specific time blocks that override regular availability (vacations, holidays, etc)
-- =============================================================================
create table nutri_time_blocks (
  id uuid primary key default gen_random_uuid(),
  nutri_id uuid references auth.users(id) on delete cascade not null,
  title varchar(100) not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  block_type block_type default 'personal',
  is_recurring boolean default false,
  recurrence_rule text, -- iCal RRULE format for recurring blocks
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint valid_block_range check (start_datetime < end_datetime)
);

comment on table nutri_time_blocks is 'Time blocks that override regular availability';
comment on column nutri_time_blocks.recurrence_rule is 'iCal RRULE format (e.g., FREQ=WEEKLY;BYDAY=MO)';

-- =============================================================================
-- Table: appointment_history
-- Audit trail for all appointment changes
-- =============================================================================
create table appointment_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade not null,
  action appointment_action not null,
  old_datetime timestamptz,
  new_datetime timestamptz,
  old_status text,
  new_status text,
  changed_by uuid references auth.users(id),
  reason text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

comment on table appointment_history is 'Audit trail for appointment changes';

-- =============================================================================
-- Alter appointments table: Add rescheduling fields
-- =============================================================================
alter table appointments
  add column if not exists rescheduled_from uuid references appointments(id),
  add column if not exists rescheduled_at timestamptz,
  add column if not exists rescheduled_reason text,
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

-- =============================================================================
-- Indexes for performance
-- =============================================================================
create index idx_nutri_availability_nutri_id on nutri_availability(nutri_id);
create index idx_nutri_availability_day_active on nutri_availability(nutri_id, day_of_week) where is_active = true;

create index idx_nutri_time_blocks_nutri_id on nutri_time_blocks(nutri_id);
create index idx_nutri_time_blocks_datetime on nutri_time_blocks(nutri_id, start_datetime, end_datetime);

create index idx_appointment_history_appointment on appointment_history(appointment_id);
create index idx_appointment_history_created_at on appointment_history(created_at);

-- =============================================================================
-- Updated_at triggers
-- =============================================================================
create trigger update_nutri_availability_updated_at
  before update on nutri_availability
  for each row execute function update_updated_at_column();

create trigger update_nutri_time_blocks_updated_at
  before update on nutri_time_blocks
  for each row execute function update_updated_at_column();

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- nutri_availability policies
alter table nutri_availability enable row level security;

create policy "Nutris can view own availability"
  on nutri_availability for select
  using (auth.uid() = nutri_id);

create policy "Nutris can insert own availability"
  on nutri_availability for insert
  with check (auth.uid() = nutri_id);

create policy "Nutris can update own availability"
  on nutri_availability for update
  using (auth.uid() = nutri_id);

create policy "Nutris can delete own availability"
  on nutri_availability for delete
  using (auth.uid() = nutri_id);

-- nutri_time_blocks policies
alter table nutri_time_blocks enable row level security;

create policy "Nutris can view own time blocks"
  on nutri_time_blocks for select
  using (auth.uid() = nutri_id);

create policy "Nutris can insert own time blocks"
  on nutri_time_blocks for insert
  with check (auth.uid() = nutri_id);

create policy "Nutris can update own time blocks"
  on nutri_time_blocks for update
  using (auth.uid() = nutri_id);

create policy "Nutris can delete own time blocks"
  on nutri_time_blocks for delete
  using (auth.uid() = nutri_id);

-- appointment_history policies
alter table appointment_history enable row level security;

create policy "Nutris can view history of own appointments"
  on appointment_history for select
  using (
    appointment_id in (
      select id from appointments where nutri_id = auth.uid()
    )
  );

create policy "System can insert appointment history"
  on appointment_history for insert
  with check (
    appointment_id in (
      select id from appointments where nutri_id = auth.uid()
    )
  );

-- =============================================================================
-- Function: Auto-create appointment history on status change
-- =============================================================================
create or replace function log_appointment_change()
returns trigger as $$
begin
  -- Log rescheduling
  if old.scheduled_at is distinct from new.scheduled_at then
    insert into appointment_history (
      appointment_id,
      action,
      old_datetime,
      new_datetime,
      changed_by,
      reason
    ) values (
      new.id,
      'rescheduled',
      old.scheduled_at,
      new.scheduled_at,
      auth.uid(),
      new.rescheduled_reason
    );
  end if;

  -- Log status changes
  if old.status is distinct from new.status then
    insert into appointment_history (
      appointment_id,
      action,
      old_status,
      new_status,
      changed_by,
      reason
    ) values (
      new.id,
      case new.status
        when 'cancelled' then 'cancelled'::appointment_action
        when 'completed' then 'completed'::appointment_action
        when 'no_show' then 'no_show'::appointment_action
        else 'rescheduled'::appointment_action
      end,
      old.status,
      new.status,
      auth.uid(),
      coalesce(new.cancellation_reason, new.rescheduled_reason)
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger appointment_change_logger
  after update on appointments
  for each row execute function log_appointment_change();

-- =============================================================================
-- Function: Log appointment creation
-- =============================================================================
create or replace function log_appointment_creation()
returns trigger as $$
begin
  insert into appointment_history (
    appointment_id,
    action,
    new_datetime,
    new_status,
    changed_by
  ) values (
    new.id,
    'created',
    new.scheduled_at,
    new.status,
    auth.uid()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger appointment_creation_logger
  after insert on appointments
  for each row execute function log_appointment_creation();
