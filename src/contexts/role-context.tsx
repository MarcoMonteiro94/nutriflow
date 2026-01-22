"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrgRole } from "@/types/database";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  isStaffRole,
  isClinicalRole,
  isAdmin,
  getDefaultRedirectPath,
  type Permission,
} from "@/lib/auth/authorization-client";

export interface RoleContextValue {
  userId: string | null;
  organizationId: string | null;
  role: OrgRole | null;
  isOwner: boolean;
  isLoading: boolean;
  error: Error | null;
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  // Role checks
  isStaffRole: () => boolean;
  isClinicalRole: () => boolean;
  isAdmin: () => boolean;
  // Helpers
  getDefaultRedirectPath: () => string;
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
  initialRole?: {
    userId: string;
    organizationId: string | null;
    role: OrgRole | null;
    isOwner: boolean;
  };
}

export function RoleProvider({ children, initialRole }: RoleProviderProps) {
  const [userId, setUserId] = useState<string | null>(initialRole?.userId ?? null);
  const [organizationId, setOrganizationId] = useState<string | null>(
    initialRole?.organizationId ?? null
  );
  const [role, setRole] = useState<OrgRole | null>(initialRole?.role ?? null);
  const [isOwner, setIsOwner] = useState(initialRole?.isOwner ?? false);
  const [isLoading, setIsLoading] = useState(!initialRole);
  const [error, setError] = useState<Error | null>(null);

  const fetchRole = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setOrganizationId(null);
        setRole(null);
        setIsOwner(false);
        return;
      }

      setUserId(user.id);

      // Try to get user's membership
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();

      if (membership) {
        setOrganizationId(membership.organization_id);
        setRole(membership.role as OrgRole);

        // Check if owner
        const { data: org } = await supabase
          .from("organizations")
          .select("owner_id")
          .eq("id", membership.organization_id)
          .single();

        setIsOwner(org?.owner_id === user.id);
        return;
      }

      // Check if user owns any organization
      const { data: ownedOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .single();

      if (ownedOrg) {
        setOrganizationId(ownedOrg.id);
        setRole("admin");
        setIsOwner(true);
        return;
      }

      // Check if user is linked as a patient
      const { data: patientRecord } = await supabase
        .from("patients")
        .select("id, nutri_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (patientRecord) {
        // User is a patient - they don't belong to an organization directly
        // but have patient role
        setRole("patient");
        setOrganizationId(null);
        setIsOwner(false);
        return;
      }

      // User has no organization - default to nutri role for backwards compatibility
      setOrganizationId(null);
      setRole("nutri");
      setIsOwner(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch role"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialRole) {
      fetchRole();
    }
  }, [initialRole]);

  const value: RoleContextValue = {
    userId,
    organizationId,
    role,
    isOwner,
    isLoading,
    error,
    hasPermission: (permission) => hasPermission(role, permission),
    hasAllPermissions: (permissions) => hasAllPermissions(role, permissions),
    hasAnyPermission: (permissions) => hasAnyPermission(role, permissions),
    isStaffRole: () => isStaffRole(role),
    isClinicalRole: () => isClinicalRole(role),
    isAdmin: () => isAdmin(role, isOwner),
    getDefaultRedirectPath: () => getDefaultRedirectPath(role),
    refresh: fetchRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

// Hook for checking specific permissions
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useRole();
  return hasPermission(permission);
}

// Hook for checking multiple permissions
export function usePermissions(permissions: Permission[], requireAll = true): boolean {
  const { hasAllPermissions, hasAnyPermission } = useRole();
  return requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
}
