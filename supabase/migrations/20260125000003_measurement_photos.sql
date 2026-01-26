-- Measurement Photos table for visual progress tracking
-- Allows nutritionists to upload progress photos (front, side, back views)
-- Photos can be linked to specific anthropometry assessments or standalone

CREATE TABLE measurement_photos (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  measurement_id uuid references anthropometry_assessments(id) on delete set null,
  photo_url text not null,
  view_type text check (view_type in ('front', 'side', 'back')),
  notes text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_measurement_photos_patient_id on measurement_photos(patient_id);
create index idx_measurement_photos_measurement_id on measurement_photos(measurement_id);
create index idx_measurement_photos_uploaded_at on measurement_photos(uploaded_at desc);

-- Enable RLS
alter table measurement_photos enable row level security;

-- ============================================
-- MEASUREMENT_PHOTOS RLS POLICIES
-- ============================================

-- Nutris can view measurement photos of their patients
create policy "Nutris can view patient measurement photos"
  on measurement_photos for select
  using (
    exists (
      select 1 from patients
      where patients.id = measurement_photos.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Patients can view their own measurement photos
create policy "Patients can view own measurement photos"
  on measurement_photos for select
  using (
    exists (
      select 1 from patients
      where patients.id = measurement_photos.patient_id
      and patients.profile_id = auth.uid()
    )
  );

-- Nutris can create measurement photos for their patients
create policy "Nutris can create measurement photos"
  on measurement_photos for insert
  with check (
    exists (
      select 1 from patients
      where patients.id = patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can update measurement photos of their patients
create policy "Nutris can update patient measurement photos"
  on measurement_photos for update
  using (
    exists (
      select 1 from patients
      where patients.id = measurement_photos.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can delete measurement photos of their patients
create policy "Nutris can delete patient measurement photos"
  on measurement_photos for delete
  using (
    exists (
      select 1 from patients
      where patients.id = measurement_photos.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Storage bucket for measurement photos
-- Note: This should be run manually via Supabase dashboard or CLI if needed
-- The bucket configuration includes RLS policies on the storage.objects table

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'measurement-photos',
  'measurement-photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for measurement-photos bucket
-- Allow authenticated nutritionists to upload photos for their patients
create policy "Nutris can upload measurement photos for their patients"
  on storage.objects for insert
  with check (
    bucket_id = 'measurement-photos'
    and auth.role() = 'authenticated'
  );

-- Allow authenticated nutritionists to view photos of their patients
create policy "Nutris can view measurement photos for their patients"
  on storage.objects for select
  using (
    bucket_id = 'measurement-photos'
    and auth.role() = 'authenticated'
  );

-- Allow authenticated nutritionists to delete photos of their patients
create policy "Nutris can delete measurement photos for their patients"
  on storage.objects for delete
  using (
    bucket_id = 'measurement-photos'
    and auth.role() = 'authenticated'
  );
