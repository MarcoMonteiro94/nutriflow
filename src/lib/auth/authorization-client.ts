import type { OrgRole } from "@/types/database";

export type Permission =
  | "view:dashboard"
  | "view:patients"
  | "manage:patients"
  | "view:appointments"
  | "manage:appointments"
  | "view:meal-plans"
  | "manage:meal-plans"
  | "view:anamnesis"
  | "manage:anamnesis"
  | "view:measurements"
  | "manage:measurements"
  | "view:organization"
  | "manage:organization"
  | "manage:members"
  | "view:own-data"
  | "view:settings";

// Role-Permission mapping based on the permission matrix
const rolePermissions: Record<OrgRole, Permission[]> = {
  admin: [
    "view:dashboard",
    "view:patients",
    "manage:patients",
    "view:appointments",
    "manage:appointments",
    "view:meal-plans",
    "manage:meal-plans",
    "view:anamnesis",
    "manage:anamnesis",
    "view:measurements",
    "manage:measurements",
    "view:organization",
    "manage:organization",
    "manage:members",
    "view:settings",
  ],
  nutri: [
    "view:dashboard",
    "view:patients",
    "manage:patients",
    "view:appointments",
    "manage:appointments",
    "view:meal-plans",
    "manage:meal-plans",
    "view:anamnesis",
    "manage:anamnesis",
    "view:measurements",
    "manage:measurements",
    "view:organization",
    "view:settings",
  ],
  receptionist: [
    "view:dashboard",
    "view:patients",
    "manage:patients",
    "view:appointments",
    "manage:appointments",
    "view:organization",
    "view:settings",
  ],
  patient: [
    "view:own-data",
    "view:settings",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: OrgRole | null, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(role: OrgRole | null, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: OrgRole | null, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: OrgRole | null): Permission[] {
  if (!role) return [];
  return rolePermissions[role] ?? [];
}

/**
 * Check if user can access staff features (admin, nutri, receptionist)
 */
export function isStaffRole(role: OrgRole | null): boolean {
  if (!role) return false;
  return ["admin", "nutri", "receptionist"].includes(role);
}

/**
 * Check if user can access clinical features (admin, nutri)
 */
export function isClinicalRole(role: OrgRole | null): boolean {
  if (!role) return false;
  return ["admin", "nutri"].includes(role);
}

/**
 * Check if user is admin
 */
export function isAdmin(role: OrgRole | null, isOwner?: boolean): boolean {
  return role === "admin" || isOwner === true;
}

/**
 * Get the default redirect path based on role
 */
export function getDefaultRedirectPath(role: OrgRole | null): string {
  switch (role) {
    case "admin":
    case "nutri":
      return "/dashboard";
    case "receptionist":
      return "/schedule";
    case "patient":
      return "/patient/dashboard";
    default:
      return "/dashboard";
  }
}

/**
 * Invite permissions: which roles can invite which other roles
 *
 * - Admin: can invite Admin, Nutri, Receptionist, Patient
 * - Nutri: can invite Receptionist, Patient
 * - Receptionist: can invite Patient only
 * - Patient: cannot invite anyone
 */
const invitePermissions: Record<OrgRole, OrgRole[]> = {
  admin: ["admin", "nutri", "receptionist", "patient"],
  nutri: ["receptionist", "patient"],
  receptionist: ["patient"],
  patient: [],
};

/**
 * Get the roles that a user with a given role can invite
 */
export function getInvitableRoles(role: OrgRole | null, isOwner?: boolean): OrgRole[] {
  // Owners can invite any role
  if (isOwner) {
    return ["admin", "nutri", "receptionist", "patient"];
  }

  if (!role) return [];
  return invitePermissions[role] ?? [];
}

/**
 * Check if a user with roleA can invite someone with roleB
 */
export function canInviteRole(inviterRole: OrgRole | null, targetRole: OrgRole, isOwner?: boolean): boolean {
  const invitableRoles = getInvitableRoles(inviterRole, isOwner);
  return invitableRoles.includes(targetRole);
}

/**
 * Check if a user can invite anyone at all
 */
export function canInviteMembers(role: OrgRole | null, isOwner?: boolean): boolean {
  return getInvitableRoles(role, isOwner).length > 0;
}

/**
 * Get role labels for display
 */
export const roleLabels: Record<OrgRole, string> = {
  admin: "Administrador",
  nutri: "Nutricionista",
  receptionist: "Recepcionista",
  patient: "Paciente",
};
