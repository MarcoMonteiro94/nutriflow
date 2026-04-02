import type { OrgRole } from "@/types/database";

export interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  usersByRole: Record<OrgRole, number>;
  totalPatients: number;
  pendingInvites: number;
}

export interface OrganizationWithStats {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  owner: { full_name: string; email: string };
  memberCount: number;
  patientCount: number;
  created_at: string;
}

export interface UserWithMembership {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  role: OrgRole;
  organization: { id: string; name: string } | null;
  orgRole: OrgRole | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  user?: { full_name: string; email: string } | null;
}
