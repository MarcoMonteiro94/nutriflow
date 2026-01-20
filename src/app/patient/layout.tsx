import { PatientBottomNav } from "@/components/layout/patient-bottom-nav";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientBottomNav>{children}</PatientBottomNav>;
}
