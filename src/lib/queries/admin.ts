import { createServiceClient } from "@/lib/supabase/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit";
import type { OrgRole } from "@/types/database";
import type {
  PlatformStats,
  OrganizationWithStats,
  UserWithMembership,
  AuditLogEntry,
} from "@/types/admin";

// ============================================
// Read Queries
// ============================================

export async function getAllOrganizations(
  filters?: { isActive?: boolean; search?: string }
): Promise<OrganizationWithStats[]> {
  await requireSuperAdminApi();
  const supabase = createServiceClient();

  let query = supabase
    .from("organizations")
    .select(
      `
      id, name, slug, is_active, created_at, owner_id,
      profiles!organizations_owner_id_fkey(full_name, email)
    `
    )
    .order("created_at", { ascending: false });

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`
    );
  }

  const { data: orgs, error } = await query;

  if (error) {
    console.error("Error fetching all organizations:", error);
    return [];
  }

  // Get member and patient counts per org
  const results: OrganizationWithStats[] = await Promise.all(
    (orgs ?? []).map(async (org) => {
      const { count: memberCount } = await supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .eq("status", "active");

      const { count: patientCount } = await supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .eq("role", "patient")
        .eq("status", "active");

      const owner = org.profiles as unknown as {
        full_name: string;
        email: string;
      } | null;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        is_active: org.is_active,
        owner: owner ?? { full_name: "Unknown", email: "" },
        memberCount: memberCount ?? 0,
        patientCount: patientCount ?? 0,
        created_at: org.created_at,
      };
    })
  );

  return results;
}

export async function getAllUsers(
  filters?: { role?: OrgRole; orgId?: string; search?: string }
): Promise<UserWithMembership[]> {
  await requireSuperAdminApi();
  const supabase = createServiceClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, is_active, is_super_admin, role, created_at")
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  if (filters?.role) {
    // OrgRole is broader than the profiles.role DB enum — cast needed
    query = query.eq("role", filters.role as never);
  }

  const { data: profiles, error } = await query;

  if (error) {
    console.error("Error fetching all users:", error);
    return [];
  }

  const results: UserWithMembership[] = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      // Get first active membership for this user
      let memberQuery = supabase
        .from("organization_members")
        .select(
          `
          role,
          organizations!organization_members_organization_id_fkey(id, name)
        `
        )
        .eq("user_id", profile.id)
        .eq("status", "active")
        .limit(1);

      if (filters?.orgId) {
        memberQuery = memberQuery.eq("organization_id", filters.orgId);
      }

      const { data: memberships } = await memberQuery;

      const membership = memberships?.[0];
      const org = membership?.organizations as unknown as {
        id: string;
        name: string;
      } | null;

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        is_active: profile.is_active,
        is_super_admin: profile.is_super_admin,
        role: profile.role as OrgRole,
        organization: org ?? null,
        orgRole: (membership?.role as OrgRole) ?? null,
        created_at: profile.created_at,
      };
    })
  );

  // If orgId filter is set, only return users with that org membership
  if (filters?.orgId) {
    return results.filter((u) => u.organization !== null);
  }

  return results;
}

export async function getAuditLogs(
  filters?: { action?: string; dateFrom?: string; dateTo?: string }
): Promise<AuditLogEntry[]> {
  await requireSuperAdminApi();
  const supabase = createServiceClient();

  // Use type assertion since audit_logs may not be in generated types yet
  let query = (supabase as any)
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  const { data: logs, error } = await query as { data: any[] | null; error: any };

  if (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }

  // Enrich with user info
  const userIds = [
    ...new Set((logs ?? []).map((l) => l.user_id).filter(Boolean)),
  ] as string[];

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds.length > 0 ? userIds : ["_none_"]);

  const userMap = new Map(
    (users ?? []).map((u) => [u.id, { full_name: u.full_name, email: u.email }])
  );

  return (logs ?? []).map((log) => ({
    id: log.id,
    user_id: log.user_id,
    action: log.action,
    resource_type: log.resource_type,
    resource_id: log.resource_id,
    metadata: (log.metadata as Record<string, unknown>) ?? {},
    ip_address: log.ip_address,
    created_at: log.created_at,
    user: log.user_id ? userMap.get(log.user_id) ?? null : null,
  }));
}

/**
 * Server-component-safe version of getPlatformStats.
 * Uses requireSuperAdmin() (redirect) instead of requireSuperAdminApi() (throw).
 * Call this from Server Components (pages/layouts) where redirect() is safe.
 */
export async function getPlatformStatsForPage(): Promise<PlatformStats> {
  const { requireSuperAdmin } = await import("@/lib/auth/authorization");
  await requireSuperAdmin();
  return getPlatformStatsInternal();
}

export async function getPlatformStats(): Promise<PlatformStats> {
  await requireSuperAdminApi();
  return getPlatformStatsInternal();
}

async function getPlatformStatsInternal(): Promise<PlatformStats> {
  const supabase = createServiceClient();

  const [
    { count: totalOrganizations },
    { count: activeOrganizations },
    { count: totalUsers },
    { count: totalPatients },
    { count: pendingInvites },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "patient"),
    supabase
      .from("organization_invites")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null),
  ]);

  // Get user counts by role
  const { data: roleCounts } = await supabase
    .from("profiles")
    .select("role");

  const usersByRole: Record<OrgRole, number> = {
    admin: 0,
    nutri: 0,
    receptionist: 0,
    patient: 0,
  };

  for (const row of roleCounts ?? []) {
    const role = row.role as OrgRole;
    if (role in usersByRole) {
      usersByRole[role]++;
    }
  }

  return {
    totalOrganizations: totalOrganizations ?? 0,
    activeOrganizations: activeOrganizations ?? 0,
    totalUsers: totalUsers ?? 0,
    usersByRole,
    totalPatients: totalPatients ?? 0,
    pendingInvites: pendingInvites ?? 0,
  };
}

// ============================================
// Mutation Queries
// ============================================

export async function deactivateOrganization(id: string): Promise<void> {
  const userRole = await requireSuperAdminApi();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("organizations")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to deactivate organization: ${error.message}`);
  }

  await logAuditEvent({
    action: "org.deactivate",
    resourceType: "organization",
    resourceId: id,
    userId: userRole.userId,
    metadata: { organization_id: id },
  });
}

export async function reactivateOrganization(id: string): Promise<void> {
  const userRole = await requireSuperAdminApi();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("organizations")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to reactivate organization: ${error.message}`);
  }

  await logAuditEvent({
    action: "org.reactivate",
    resourceType: "organization",
    resourceId: id,
    userId: userRole.userId,
    metadata: { organization_id: id },
  });
}

export async function deactivateUser(id: string): Promise<void> {
  const userRole = await requireSuperAdminApi();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to deactivate user: ${error.message}`);
  }

  await logAuditEvent({
    action: "user.deactivate",
    resourceType: "user",
    resourceId: id,
    userId: userRole.userId,
    metadata: { target_user_id: id },
  });
}
