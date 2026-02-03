-- Add is_super_admin flag to profiles table
-- Super admins are system-level administrators (developers, platform managers)
-- They have access to all organizations and administrative features

ALTER TABLE profiles
ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN profiles.is_super_admin IS 'System-level admin flag. Super admins can access all organizations and admin features.';

-- Create index for faster lookups
CREATE INDEX idx_profiles_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;
