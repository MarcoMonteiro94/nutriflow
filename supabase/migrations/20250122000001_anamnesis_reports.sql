-- Anamnesis Reports table for AI-powered anamnesis processing
create table anamnesis_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  nutri_id uuid not null references profiles(id) on delete cascade,

  -- Structured content
  chief_complaint text,
  history_present_illness text,
  past_medical_history jsonb default '[]',
  family_history jsonb default '[]',
  social_history jsonb default '{}',
  dietary_history jsonb default '{}',
  current_medications jsonb default '[]',
  supplements jsonb default '[]',
  goals jsonb default '[]',
  observations text,

  -- AI metadata
  source_type text not null check (source_type in ('audio', 'text', 'hybrid')),
  original_transcript text,
  audio_file_path text,
  audio_duration_seconds integer,
  ai_model_used text,
  confidence_score numeric(3,2),

  -- Workflow
  status text not null default 'draft' check (status in ('draft', 'processing', 'review', 'approved')),
  approved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_anamnesis_reports_patient_id on anamnesis_reports(patient_id);
create index idx_anamnesis_reports_nutri_id on anamnesis_reports(nutri_id);
create index idx_anamnesis_reports_status on anamnesis_reports(status);
create index idx_anamnesis_reports_created_at on anamnesis_reports(created_at desc);

-- Enable RLS
alter table anamnesis_reports enable row level security;

-- RLS policy: Nutris can only manage their own reports
create policy "Nutris can manage own reports"
  on anamnesis_reports for all
  using (auth.uid() = nutri_id);

-- Create updated_at trigger
create or replace function update_anamnesis_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_anamnesis_reports_updated_at
  before update on anamnesis_reports
  for each row
  execute function update_anamnesis_reports_updated_at();

-- Storage bucket for audio files (run manually in Supabase dashboard or via CLI)
-- insert into storage.buckets (id, name, public, file_size_limit)
-- values ('anamnesis-audio', 'anamnesis-audio', false, 52428800); -- 50MB limit
