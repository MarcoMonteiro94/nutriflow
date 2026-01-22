import { createClient, createServiceClient } from "@/lib/supabase/server";
import type {
  Organization,
  OrganizationMember,
  OrganizationInvite,
  InsertTables,
  UpdateTables,
  OrgRole,
} from "@/types/database";
import { nanoid } from "nanoid";

export type InsertOrganization = InsertTables<"organizations">;
export type UpdateOrganization = UpdateTables<"organizations">;
export type InsertOrganizationMember = InsertTables<"organization_members">;
export type InsertOrganizationInvite = InsertTables<"organization_invites">;

// ============================================
// Organization CRUD
// ============================================

export async function getUserOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Simple query - RLS policies will filter to user's organizations
  // The RLS uses get_user_org_ids() function which handles the filtering
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }

  return (data ?? []) as Organization[];
}

export async function getOrganizationById(
  id: string
): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching organization:", error);
    return null;
  }

  return data as Organization;
}

export async function getOrganizationBySlug(
  slug: string
): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching organization by slug:", error);
    return null;
  }

  return data as Organization;
}

export async function createOrganization(
  org: Omit<InsertOrganization, "owner_id">
): Promise<{ data: Organization | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  // Check if slug is available
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", org.slug)
    .single();

  if (existingOrg) {
    return { data: null, error: "Este slug já está em uso" };
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({ ...org, owner_id: user.id })
    .select("id, name, slug, logo_url, settings, owner_id, created_at, updated_at")
    .single();

  if (error) {
    console.error("Error creating organization:", error);
    return { data: null, error: error.message };
  }

  // Add owner as admin member automatically
  await supabase.from("organization_members").insert({
    organization_id: data?.id as string,
    user_id: user.id,
    role: "admin",
    status: "active",
    accepted_at: new Date().toISOString(),
  });

  return { data: data as Organization, error: null };
}

export async function updateOrganization(
  id: string,
  updates: UpdateOrganization
): Promise<{ data: Organization | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  // Check if slug is being changed and is available
  if (updates.slug) {
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", updates.slug)
      .neq("id", id)
      .single();

    if (existingOrg) {
      return { data: null, error: "Este slug já está em uso" };
    }
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating organization:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Organization, error: null };
}

export async function deleteOrganization(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  // Verify user is the owner
  const { data: org } = await supabase
    .from("organizations")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (!org || org.owner_id !== user.id) {
    return { error: "Apenas o proprietário pode excluir a organização" };
  }

  const { error } = await supabase.from("organizations").delete().eq("id", id);

  if (error) {
    console.error("Error deleting organization:", error);
    return { error: error.message };
  }

  return { error: null };
}

// ============================================
// Organization Members
// ============================================

export type MemberWithProfile = OrganizationMember & {
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
};

export async function getOrganizationMembers(
  organizationId: string
): Promise<MemberWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      id, organization_id, user_id, role, invited_by, invited_at, accepted_at, status, created_at, updated_at,
      profiles!organization_members_user_id_fkey(id, full_name, email)
    `
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching organization members:", error);
    return [];
  }

  return (data ?? []).map((member) => ({
    id: member.id,
    organization_id: member.organization_id,
    user_id: member.user_id,
    role: member.role,
    invited_by: member.invited_by,
    invited_at: member.invited_at,
    accepted_at: member.accepted_at,
    status: member.status,
    created_at: member.created_at,
    updated_at: member.updated_at,
    profiles: member.profiles as { id: string; full_name: string; email: string },
  })) as MemberWithProfile[];
}

export async function updateMemberRole(
  memberId: string,
  role: OrgRole
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    console.error("Error updating member role:", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function updateMemberStatus(
  memberId: string,
  status: "active" | "inactive"
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_members")
    .update({ status })
    .eq("id", memberId);

  if (error) {
    console.error("Error updating member status:", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function removeMember(
  memberId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("Error removing member:", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function isUserOrgAdmin(organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  // Check if owner
  const { data: org } = await supabase
    .from("organizations")
    .select("owner_id")
    .eq("id", organizationId)
    .single();

  if (org?.owner_id === user.id) {
    return true;
  }

  // Check if admin member
  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  return member?.role === "admin";
}

export async function getUserOrgMembership(
  organizationId: string
): Promise<OrganizationMember | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return null;
  }

  return data as OrganizationMember;
}

// ============================================
// Organization Invites
// ============================================

export async function getOrganizationInvites(
  organizationId: string
): Promise<OrganizationInvite[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching organization invites:", error);
    return [];
  }

  return (data ?? []) as OrganizationInvite[];
}

export async function createInvite(
  organizationId: string,
  email: string,
  role: OrgRole
): Promise<{ data: OrganizationInvite | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  // Check if email is already invited
  const { data: existingInvite } = await supabase
    .from("organization_invites")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email", email.toLowerCase())
    .is("accepted_at", null)
    .single();

  if (existingInvite) {
    return { data: null, error: "Este email já possui um convite pendente" };
  }

  // Check if user is already a member
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existingProfile) {
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", existingProfile.id)
      .single();

    if (existingMember) {
      return { data: null, error: "Este usuário já é membro da organização" };
    }
  }

  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: organizationId,
      email: email.toLowerCase(),
      role,
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invite:", error);
    return { data: null, error: error.message };
  }

  return { data: data as OrganizationInvite, error: null };
}

export async function deleteInvite(
  inviteId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_invites")
    .delete()
    .eq("id", inviteId);

  if (error) {
    console.error("Error deleting invite:", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function getInviteByToken(
  token: string
): Promise<(OrganizationInvite & { organization: Organization }) | null> {
  // Use service client to bypass RLS - invites need to be accessible for unauthenticated users
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("organization_invites")
    .select(
      `
      id, organization_id, email, role, invited_by, token, expires_at, accepted_at, created_at,
      organization:organization_id(id, name, slug, logo_url, settings, owner_id, created_at, updated_at)
    `
    )
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (error) {
    console.error("Error fetching invite by token:", error);
    return null;
  }

  // Check if expired
  if (new Date(data.expires_at as string) < new Date()) {
    return null;
  }

  return {
    id: data.id,
    organization_id: data.organization_id,
    email: data.email,
    role: data.role,
    invited_by: data.invited_by,
    token: data.token,
    expires_at: data.expires_at,
    accepted_at: data.accepted_at,
    created_at: data.created_at,
    organization: data.organization as unknown as Organization,
  } as OrganizationInvite & { organization: Organization };
}

export async function acceptInvite(
  token: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  // Get invite
  const invite = await getInviteByToken(token);

  if (!invite) {
    return { error: "Convite inválido ou expirado" };
  }

  // Add user as member
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
      invited_by: invite.invited_by,
      status: "active",
      accepted_at: new Date().toISOString(),
    });

  if (memberError) {
    console.error("Error adding member:", memberError);
    return { error: memberError.message };
  }

  // Mark invite as accepted
  const { error: updateError } = await supabase
    .from("organization_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateError) {
    console.error("Error updating invite:", updateError);
    // Member was added, so don't return error
  }

  return { error: null };
}

// ============================================
// Dashboard Stats
// ============================================

export type OrgDashboardStats = {
  totalMembers: number;
  activeMembers: number;
  totalAppointmentsToday: number;
  pendingInvites: number;
};

export async function getOrganizationDashboardStats(
  organizationId: string
): Promise<OrgDashboardStats> {
  const supabase = await createClient();

  // Get member counts
  const { data: members } = await supabase
    .from("organization_members")
    .select("id, status")
    .eq("organization_id", organizationId);

  const totalMembers = members?.length ?? 0;
  const activeMembers =
    members?.filter((m) => m.status === "active").length ?? 0;

  // Get pending invites count
  const { count: pendingInvites } = await supabase
    .from("organization_invites")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("accepted_at", null);

  // Get today's appointments count for the org
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { count: totalAppointmentsToday } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("scheduled_at", startOfDay)
    .lte("scheduled_at", endOfDay);

  return {
    totalMembers,
    activeMembers,
    totalAppointmentsToday: totalAppointmentsToday ?? 0,
    pendingInvites: pendingInvites ?? 0,
  };
}

// ============================================
// Nutri Schedule for Admin View
// ============================================

export type NutriWithAppointments = MemberWithProfile & {
  todayAppointmentsCount: number;
  inProgressCount: number;
};

export async function getOrganizationNutrisWithSchedule(
  organizationId: string
): Promise<NutriWithAppointments[]> {
  const supabase = await createClient();

  // Get all nutri members
  const { data: members, error } = await supabase
    .from("organization_members")
    .select(
      `
      id, organization_id, user_id, role, invited_by, invited_at, accepted_at, status, created_at, updated_at,
      profiles!organization_members_user_id_fkey(id, full_name, email)
    `
    )
    .eq("organization_id", organizationId)
    .in("role", ["nutri", "admin"])
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error || !members) {
    console.error("Error fetching nutris:", error);
    return [];
  }

  // Get today's date range
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  // Get appointments for each nutri
  const nutrisWithAppointments = await Promise.all(
    members.map(async (member) => {
      const userId = member.user_id as string;

      const { count: todayCount } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("nutri_id", userId)
        .gte("scheduled_at", startOfDay)
        .lte("scheduled_at", endOfDay);

      const { count: inProgressCount } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("nutri_id", userId)
        .eq("status", "confirmed")
        .gte("scheduled_at", startOfDay)
        .lte("scheduled_at", endOfDay);

      return {
        id: member.id,
        organization_id: member.organization_id,
        user_id: member.user_id,
        role: member.role,
        invited_by: member.invited_by,
        invited_at: member.invited_at,
        accepted_at: member.accepted_at,
        status: member.status,
        created_at: member.created_at,
        updated_at: member.updated_at,
        profiles: member.profiles as { id: string; full_name: string; email: string },
        todayAppointmentsCount: todayCount ?? 0,
        inProgressCount: inProgressCount ?? 0,
      } as NutriWithAppointments;
    })
  );

  return nutrisWithAppointments;
}
