import { PatientLayout } from "@/components/layout/patient-layout";
import { OnboardingBanner } from "@/components/onboarding-banner";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { createClient } from "@/lib/supabase/server";
import { RoleProvider } from "@/contexts/role-context";

export default async function PatientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is authenticated and is a patient
  let isAuthenticated = false;
  let hasChallenges = false;
  let hasAnamnesis = false;
  let patientId: string | null = null;

  if (user) {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    isAuthenticated = !!patient;
    patientId = patient?.id || null;

    if (patientId) {
      // Check if patient has any challenge participations
      const { count: challengeCount } = await supabase
        .from("challenge_participants")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patientId);

      hasChallenges = (challengeCount ?? 0) > 0;

      // Check if patient has any approved anamnesis reports
      const { count: anamnesisCount } = await supabase
        .from("anamnesis_reports")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patientId)
        .eq("status", "approved");

      hasAnamnesis = (anamnesisCount ?? 0) > 0;
    }
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
      <PatientLayout isAuthenticated={isAuthenticated} hasChallenges={hasChallenges} hasAnamnesis={hasAnamnesis}>
        {isAuthenticated && user && <OnboardingBanner userId={user.id} role="patient" />}
        {children}
      </PatientLayout>
      <PWAInstallPrompt />
    </RoleProvider>
  );
}
