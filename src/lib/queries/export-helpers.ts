import { createClient } from "@/lib/supabase/server";
import type { Patient, Measurement } from "@/types/database";

/**
 * Shared validation and data fetching for export routes (PDF/CSV).
 * Eliminates ~30 lines of duplicated auth + patient validation.
 */
export async function getExportData(patientId: string): Promise<{
  error?: string;
  status?: number;
  patient?: Patient;
  measurements?: Measurement[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado", status: 401 };
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (!patient) {
    return { error: "Paciente não encontrado", status: 404 };
  }

  const { data: measurements } = await supabase
    .from("measurements")
    .select("*")
    .eq("patient_id", patientId)
    .order("measured_at", { ascending: true });

  return {
    patient: patient as Patient,
    measurements: (measurements ?? []) as Measurement[],
  };
}
