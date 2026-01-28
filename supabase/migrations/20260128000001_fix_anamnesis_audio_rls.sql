-- Fix storage RLS policies for anamnesis-audio bucket
-- Issue #14: storage RLS muito permissivo
--
-- Audio files are stored as: {nutri_id}/{patient_id}/{timestamp}.{ext}
-- Only the owning nutritionist should be able to upload/view/delete

-- =============================================
-- Drop existing overly permissive policies
-- =============================================
drop policy if exists "Authenticated users can upload audio" on storage.objects;
drop policy if exists "Authenticated users can view audio" on storage.objects;
drop policy if exists "Authenticated users can delete audio" on storage.objects;
drop policy if exists "Nutris can upload anamnesis audio" on storage.objects;
drop policy if exists "Nutris can view anamnesis audio" on storage.objects;
drop policy if exists "Nutris can delete anamnesis audio" on storage.objects;
drop policy if exists "Nutris can update anamnesis audio" on storage.objects;
drop policy if exists "Patients can view own anamnesis audio" on storage.objects;
drop policy if exists "Receptionists can view anamnesis audio" on storage.objects;

-- =============================================
-- Nutritionist policies (full access to their files)
-- =============================================

-- INSERT: Nutri can upload if the path starts with their user_id
-- AND they own the patient (validated via patients table)
create policy "Nutris can upload anamnesis audio"
  on storage.objects for insert
  with check (
    bucket_id = 'anamnesis-audio'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from patients
      where patients.id::text = (storage.foldername(name))[2]
      and patients.nutri_id = auth.uid()
    )
  );

-- SELECT: Nutri can view files in their folder
create policy "Nutris can view anamnesis audio"
  on storage.objects for select
  using (
    bucket_id = 'anamnesis-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Nutri can delete files in their folder
create policy "Nutris can delete anamnesis audio"
  on storage.objects for delete
  using (
    bucket_id = 'anamnesis-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Nutri can update files in their folder (for metadata)
create policy "Nutris can update anamnesis audio"
  on storage.objects for update
  using (
    bucket_id = 'anamnesis-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================
-- Patient policies (read-only access to their audio)
-- =============================================

-- Patients can listen to their own anamnesis audio
-- Path is {nutri_id}/{patient_id}/* - patient needs to verify they own the patient_id
create policy "Patients can view own anamnesis audio"
  on storage.objects for select
  using (
    bucket_id = 'anamnesis-audio'
    and exists (
      select 1 from patients
      where patients.id::text = (storage.foldername(name))[2]
      and patients.user_id = auth.uid()
    )
  );

-- =============================================
-- Receptionist policies (read-only via organization)
-- =============================================

-- Receptionists can view audio for patients of nutris in their organization
-- Uses existing get_org_nutri_ids() function that returns nutri IDs in same org
create policy "Receptionists can view anamnesis audio"
  on storage.objects for select
  using (
    bucket_id = 'anamnesis-audio'
    and exists (
      select 1 from patients
      where patients.id::text = (storage.foldername(name))[2]
      and patients.nutri_id in (select get_org_nutri_ids())
    )
    and is_receptionist()
  );
