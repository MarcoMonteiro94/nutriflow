import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPatientToken } from "@/lib/patient-token";
import { PatientDetailContent } from "./_components/patient-detail-content";
import type { Patient } from "@/types/database";
import { createClient as createServiceClient } from "@supabase/supabase-js";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) {
    return null;
  }

  return patient as Patient;
}

async function getPatientStats(patientId: string) {
  const supabase = await createClient();

  const { count: mealPlansCount } = await supabase
    .from("meal_plans")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const { count: appointmentsCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const { count: measurementsCount } = await supabase
    .from("measurements")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const { count: anamnesisCount } = await supabase
    .from("anamnesis_reports")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const { count: anthropometryCount } = await supabase
    .from("anthropometry_assessments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  return {
    mealPlans: mealPlansCount ?? 0,
    appointments: appointmentsCount ?? 0,
    measurements: measurementsCount ?? 0,
    anamnesis: anamnesisCount ?? 0,
    anthropometry: anthropometryCount ?? 0,
  };
}

async function getLinkedUserEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null;

  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data } = await serviceClient.auth.admin.getUserById(userId);
    return data?.user?.email || null;
  } catch {
    return null;
  }
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const [stats, linkedUserEmail] = await Promise.all([
    getPatientStats(id),
    getLinkedUserEmail(patient.user_id || null),
  ]);

  async function generateToken() {
    "use server";
    return await createPatientToken(id);
  }

  return (
    <PatientDetailContent
      patient={patient}
      stats={stats}
      linkedUserEmail={linkedUserEmail}
      generateToken={generateToken}
    />
  );
}
