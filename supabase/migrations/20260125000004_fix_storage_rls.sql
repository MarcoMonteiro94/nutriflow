-- Fix storage RLS policies to validate path ownership
-- Photos are stored as: {nutri_id}/{patient_id}/{filename}
-- Only the owning nutritionist should be able to access

-- Drop existing overly permissive policies
drop policy if exists "Nutris can upload measurement photos for their patients" on storage.objects;
drop policy if exists "Nutris can view measurement photos for their patients" on storage.objects;
drop policy if exists "Nutris can delete measurement photos for their patients" on storage.objects;

-- Create new policies that validate path ownership
create policy "Nutris can upload measurement photos for their patients"
  on storage.objects for insert
  with check (
    bucket_id = 'measurement-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Nutris can view measurement photos for their patients"
  on storage.objects for select
  using (
    bucket_id = 'measurement-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Nutris can delete measurement photos for their patients"
  on storage.objects for delete
  using (
    bucket_id = 'measurement-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Patients can view their own photos (path: {nutri_id}/{patient_id}/*)
-- They need to verify they own the patient_id in the path
create policy "Patients can view their own measurement photos"
  on storage.objects for select
  using (
    bucket_id = 'measurement-photos'
    and exists (
      select 1 from patients
      where patients.id::text = (storage.foldername(name))[2]
      and patients.profile_id = auth.uid()
    )
  );
