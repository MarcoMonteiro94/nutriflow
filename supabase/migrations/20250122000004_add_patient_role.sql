-- =============================================
-- Add 'patient' role to organization members
-- =============================================

-- Add 'patient' to the role check constraint
-- First, we need to drop the existing constraint and recreate it
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE organization_members
ADD CONSTRAINT organization_members_role_check
CHECK (role IN ('admin', 'nutri', 'receptionist', 'patient'));

-- Same for organization_invites
ALTER TABLE organization_invites
DROP CONSTRAINT IF EXISTS organization_invites_role_check;

ALTER TABLE organization_invites
ADD CONSTRAINT organization_invites_role_check
CHECK (role IN ('admin', 'nutri', 'receptionist', 'patient'));

-- =============================================
-- Link patients table to organization_members
-- =============================================

-- Add a reference from patients to the user who is the patient
-- This allows us to link a patient record to their user account
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- =============================================
-- Update RLS for patient access
-- =============================================

-- Drop existing policies if they exist (for re-runability)
DROP POLICY IF EXISTS "Patients can view own record" ON patients;
DROP POLICY IF EXISTS "Patients can update own record" ON patients;
DROP POLICY IF EXISTS "Patients can view own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Patients can view own meals" ON meals;
DROP POLICY IF EXISTS "Patients can view own meal contents" ON meal_contents;
DROP POLICY IF EXISTS "Patients can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can view own measurements" ON measurements;
DROP POLICY IF EXISTS "Patients can view own anamnesis" ON anamnesis_reports;

-- Patients can view their own patient record
CREATE POLICY "Patients can view own record"
  ON patients FOR SELECT
  USING (user_id = auth.uid());

-- Patients can update limited fields on their own record
CREATE POLICY "Patients can update own record"
  ON patients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- Patient access to meal plans
-- =============================================

-- Patients can view their own meal plans
CREATE POLICY "Patients can view own meal plans"
  ON meal_plans FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Patients can view meals from their plans
CREATE POLICY "Patients can view own meals"
  ON meals FOR SELECT
  USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE patient_id IN (
        SELECT id FROM patients WHERE user_id = auth.uid()
      )
    )
  );

-- Patients can view meal contents from their plans
CREATE POLICY "Patients can view own meal contents"
  ON meal_contents FOR SELECT
  USING (
    meal_id IN (
      SELECT id FROM meals WHERE meal_plan_id IN (
        SELECT id FROM meal_plans WHERE patient_id IN (
          SELECT id FROM patients WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================
-- Patient access to appointments
-- =============================================

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- Patient access to measurements
-- =============================================

-- Patients can view their own measurements
CREATE POLICY "Patients can view own measurements"
  ON measurements FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- Patient access to anamnesis
-- =============================================

-- Patients can view their own anamnesis reports (only approved ones)
CREATE POLICY "Patients can view own anamnesis"
  ON anamnesis_reports FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
    AND status = 'approved'
  );

-- =============================================
-- Helper function to get user's role in an organization
-- =============================================

CREATE OR REPLACE FUNCTION get_user_role_in_org(org_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  -- Check if owner (always admin)
  IF EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND owner_id = auth.uid()) THEN
    RETURN 'admin';
  END IF;

  -- Get role from membership
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active';

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
