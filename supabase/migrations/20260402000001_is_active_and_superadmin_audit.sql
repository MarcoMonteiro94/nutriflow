-- Task 04: Add soft delete (is_active) to organizations and profiles,
-- and expand audit_logs RLS for super admins.
-- See ADR-003 (audit_logs RLS) and ADR-004 (soft delete pattern).

-- 1. Add is_active to organizations
ALTER TABLE organizations
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_organizations_is_active
  ON organizations(is_active)
  WHERE is_active = TRUE;

-- 2. Add is_active to profiles
ALTER TABLE profiles
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_profiles_is_active
  ON profiles(is_active)
  WHERE is_active = TRUE;

-- 3. Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_super_admin = TRUE
    )
  );
