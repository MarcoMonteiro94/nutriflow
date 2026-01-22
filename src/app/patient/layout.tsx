import { PatientBottomNav } from "@/components/layout/patient-bottom-nav";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { createClient } from "@/lib/supabase/server";
import { RoleProvider } from "@/contexts/role-context";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is authenticated and is a patient
  let isAuthenticated = false;
  if (user) {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    isAuthenticated = !!patient;
  }

  return (
    <RoleProvider
      initialRole={
        isAuthenticated && user
          ? {
              userId: user.id,
              organizationId: null,
              role: "patient",
              isOwner: false,
            }
          : undefined
      }
    >
      <PatientBottomNav isAuthenticated={isAuthenticated}>
        {children}
      </PatientBottomNav>
      <PWAInstallPrompt />
    </RoleProvider>
  );
}
