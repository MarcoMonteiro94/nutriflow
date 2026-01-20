import { PatientBottomNav } from "@/components/layout/patient-bottom-nav";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PatientBottomNav>{children}</PatientBottomNav>
      <PWAInstallPrompt />
    </>
  );
}
