import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NutriSidebar } from "@/components/layout/nutri-sidebar";
import { createClient } from "@/lib/supabase/server";
import { RoleProvider } from "@/contexts/role-context";
import type { OrgRole } from "@/types/database";

type ProfileData = {
  full_name: string;
  email: string;
} | null;

export default async function NutriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense-in-depth: redirect if not authenticated
  if (!user) {
    redirect("/auth/login");
  }

  // Get profile data for the sidebar
  let profile: ProfileData = null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();
  profile = data as ProfileData;

  // Get user's role and organization
  let role: OrgRole | null = null;
  let organizationId: string | null = null;
  let isOwner = false;

  // Check organization membership
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  if (membership) {
    organizationId = membership.organization_id;
    role = membership.role as OrgRole;

    // Check if owner
    const { data: org } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", membership.organization_id)
      .single();

    isOwner = org?.owner_id === user.id;
  } else {
    // Check if user owns any organization
    const { data: ownedOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (ownedOrg) {
      organizationId = ownedOrg.id;
      role = "admin";
      isOwner = true;
    } else {
      // Check user metadata for user_type
      const userType = user.user_metadata?.user_type;

      if (userType === "patient") {
        // Patient trying to access nutri area - redirect to patient portal
        redirect("/patient/dashboard");
      } else if (userType === "invite") {
        // User signed up via invite but hasn't accepted yet
        // They shouldn't be here - redirect to home
        redirect("/");
      } else {
        // User is a nutri without an organization
        // Redirect to create organization page (unless already there)
        const headersList = await headers();
        const pathname = headersList.get("x-pathname") || "";

        // Allow access to organization/create without redirect loop
        if (!pathname.includes("/organization/create")) {
          redirect("/organization/create");
        }

        // Default to nutri for the create org page
        role = "nutri";
      }
    }
  }

  // Patients should be redirected to the patient area
  if (role === "patient") {
    redirect("/patient/dashboard");
  }

  return (
    <RoleProvider
      initialRole={{
        userId: user.id,
        organizationId,
        role,
        isOwner,
      }}
    >
      <NutriSidebar
        user={
          profile
            ? {
                name: profile.full_name,
                email: profile.email,
              }
            : {
                name: user.user_metadata?.full_name || "Usuário",
                email: user.email || "",
              }
        }
        role={role}
        isOwner={isOwner}
      >
        {children}
      </NutriSidebar>
    </RoleProvider>
  );
}
