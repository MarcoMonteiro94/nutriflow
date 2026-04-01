-- Migration: Invite-Only Account Refactor
-- 1. Make profiles.role nullable (role source of truth moves to organization_members)
-- 2. Fix RLS policy that blocks admins from creating patients
-- 3. Update handle_new_user() trigger to always create profile (with NULL role for invites)
-- 4. Backfill profiles for users that were missing them

-- ============================================
-- 1. Make profiles.role nullable
-- ============================================
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT NULL;

-- ============================================
-- 2. Fix RLS: "Nutris can create patients" → "Clinical staff can create patients"
-- The old policy checked profiles.role = 'nutri', blocking admins.
-- New policy checks organization_members.role IN ('admin', 'nutri')
-- with backward compat for legacy users without org membership.
-- ============================================
DROP POLICY IF EXISTS "Nutris can create patients" ON patients;

CREATE POLICY "Clinical staff can create patients"
  ON patients FOR INSERT
  WITH CHECK (
    auth.uid() = nutri_id
    AND (
      EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'nutri')
        AND status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'nutri'
      )
    )
  );

-- ============================================
-- 3. Update handle_new_user() trigger
-- Always create a profile (needed for FK references throughout the app).
-- For invite/patient signups: role = NULL (role comes from organization_members)
-- For legacy direct signups: role = 'nutri' (backward compat, shouldn't happen in invite-only mode)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_type text;
BEGIN
  v_user_type := new.raw_user_meta_data->>'user_type';

  IF v_user_type IN ('patient', 'invite') THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
      NULL
    );
  ELSE
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
      'nutri'::public.user_role
    );
  END IF;

  RETURN new;
END;
$$;

-- ============================================
-- 4. Backfill profiles for users missing them
-- (invite/patient users created before trigger was fixed)
-- ============================================
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', 'Usuário'),
  NULL
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
