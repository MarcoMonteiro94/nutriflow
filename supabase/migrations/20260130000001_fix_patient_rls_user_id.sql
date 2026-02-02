-- Fix patient RLS policies to use user_id instead of profile_id
-- Problem: Patient linking uses user_id, but RLS policies check profile_id
-- Result: Authenticated patients can't access their own data
--
-- This migration updates all RLS policies to use user_id for patient access

-- ============================================
-- PATIENTS TABLE POLICIES
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Nutris can view own patients" ON patients;

-- Recreate with user_id check
CREATE POLICY "Nutris can view own patients"
  ON patients FOR SELECT
  USING (
    auth.uid() = nutri_id
    OR auth.uid() = user_id
  );

-- ============================================
-- MEAL_PLANS POLICIES
-- ============================================

-- Drop patient access policy
DROP POLICY IF EXISTS "Patients can view own meal plans" ON meal_plans;

-- Recreate with user_id check
CREATE POLICY "Patients can view own meal plans"
  ON meal_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = meal_plans.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- ============================================
-- MEALS POLICIES
-- ============================================

-- Drop and recreate policy
DROP POLICY IF EXISTS "Users can view accessible meals" ON meals;

CREATE POLICY "Users can view accessible meals"
  ON meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meals.meal_plan_id
      AND (
        meal_plans.nutri_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patients
          WHERE patients.id = meal_plans.patient_id
          AND patients.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- MEAL_CONTENTS POLICIES
-- ============================================

-- Drop and recreate policy
DROP POLICY IF EXISTS "Users can view accessible meal contents" ON meal_contents;

CREATE POLICY "Users can view accessible meal contents"
  ON meal_contents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meals
      JOIN meal_plans ON meal_plans.id = meals.meal_plan_id
      WHERE meals.id = meal_contents.meal_id
      AND (
        meal_plans.nutri_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patients
          WHERE patients.id = meal_plans.patient_id
          AND patients.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- APPOINTMENTS POLICIES
-- ============================================

-- Drop and recreate patient policy
DROP POLICY IF EXISTS "Patients can view own appointments" ON appointments;

CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = appointments.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- ============================================
-- MEASUREMENTS POLICIES
-- ============================================

-- Drop and recreate patient policy
DROP POLICY IF EXISTS "Patients can view own measurements" ON measurements;

CREATE POLICY "Patients can view own measurements"
  ON measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = measurements.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- ============================================
-- ANTHROPOMETRIC_DATA POLICIES (if exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Patients can view own anthropometric data') THEN
    DROP POLICY "Patients can view own anthropometric data" ON anthropometric_data;
  END IF;
END $$;

-- Recreate if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anthropometric_data') THEN
    EXECUTE '
      CREATE POLICY "Patients can view own anthropometric data"
        ON anthropometric_data FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = anthropometric_data.patient_id
            AND patients.user_id = auth.uid()
          )
        )
    ';
  END IF;
END $$;

-- ============================================
-- CUSTOM_MEASUREMENTS POLICIES (if exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Patients can view own custom measurements') THEN
    DROP POLICY "Patients can view own custom measurements" ON custom_measurements;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_measurements') THEN
    EXECUTE '
      CREATE POLICY "Patients can view own custom measurements"
        ON custom_measurements FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = custom_measurements.patient_id
            AND patients.user_id = auth.uid()
          )
        )
    ';
  END IF;
END $$;

-- ============================================
-- MEASUREMENT_PHOTOS POLICIES (if exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Patients can view own measurement photos') THEN
    DROP POLICY "Patients can view own measurement photos" ON measurement_photos;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'measurement_photos') THEN
    EXECUTE '
      CREATE POLICY "Patients can view own measurement photos"
        ON measurement_photos FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = measurement_photos.patient_id
            AND patients.user_id = auth.uid()
          )
        )
    ';
  END IF;
END $$;

-- ============================================
-- MEASUREMENT_GOALS POLICIES (if exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Patients can view own measurement goals') THEN
    DROP POLICY "Patients can view own measurement goals" ON measurement_goals;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'measurement_goals') THEN
    EXECUTE '
      CREATE POLICY "Patients can view own measurement goals"
        ON measurement_goals FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = measurement_goals.patient_id
            AND patients.user_id = auth.uid()
          )
        )
    ';
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTION: Check if user is the patient
-- (SECURITY DEFINER to avoid recursion issues)
-- ============================================

CREATE OR REPLACE FUNCTION is_patient_user(patient_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM patients
    WHERE id = patient_uuid
    AND user_id = user_uuid
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION is_patient_user(UUID, UUID) TO authenticated;

-- ============================================
-- Update the challenges helper function to use user_id
-- ============================================

-- Already using user_id in the functions created in previous migration
-- No changes needed there

-- ============================================
-- STORAGE RLS: Update patient-photos bucket policy if needed
-- ============================================

-- Note: Storage policies might also need updating
-- Check storage.objects policies for profile_id references
