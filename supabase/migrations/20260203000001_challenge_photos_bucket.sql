-- =============================================
-- CHALLENGE PHOTOS STORAGE BUCKET
-- =============================================

-- Create bucket for challenge photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-photos', 'challenge-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Patients can upload their own challenge photos
CREATE POLICY "Patients can upload own challenge photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'challenge-photos' AND
  auth.uid() IS NOT NULL
);

-- Policy: Authenticated users can view challenge photos
CREATE POLICY "Authenticated users can view challenge photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'challenge-photos' AND
  auth.uid() IS NOT NULL
);

-- Policy: Patients can delete their own challenge photos
CREATE POLICY "Patients can delete own challenge photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'challenge-photos' AND
  auth.uid() IS NOT NULL
);

-- Policy: Patients can update their own challenge photos
CREATE POLICY "Patients can update own challenge photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'challenge-photos' AND
  auth.uid() IS NOT NULL
);
