import { createClient } from "@/lib/supabase/server";
import type { Patient } from "@/types/database";

/**
 * Get a single patient by ID. RLS handles authorization.
 */
export async function getPatientById(id: string): Promise<Patient | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  return data as Patient | null;
}

/**
 * Get all patients for the current user. For receptionists, RLS returns org patients.
 */
export async function getPatientsList(options?: {
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ patients: Patient[]; totalCount: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { patients: [], totalCount: 0 };

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (options?.searchQuery) {
    query = query.or(
      `full_name.ilike.%${options.searchQuery}%,email.ilike.%${options.searchQuery}%,phone.ilike.%${options.searchQuery}%`
    );
  }

  const { data, count } = await query;

  return { patients: (data ?? []) as Patient[], totalCount: count ?? 0 };
}

/**
 * Get patient stats (counts) for the detail page. All queries run in parallel.
 */
export async function getPatientStats(patientId: string) {
  const supabase = await createClient();

  const [
    { count: mealPlansCount },
    { count: appointmentsCount },
    { count: measurementsCount },
    { count: anamnesisCount },
    { count: anthropometryCount },
  ] = await Promise.all([
    supabase.from("meal_plans").select("*", { count: "exact", head: true }).eq("patient_id", patientId),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("patient_id", patientId),
    supabase.from("measurements").select("*", { count: "exact", head: true }).eq("patient_id", patientId),
    supabase.from("anamnesis_reports").select("*", { count: "exact", head: true }).eq("patient_id", patientId),
    supabase.from("anthropometry_assessments").select("*", { count: "exact", head: true }).eq("patient_id", patientId),
  ]);

  return {
    mealPlans: mealPlansCount ?? 0,
    appointments: appointmentsCount ?? 0,
    measurements: measurementsCount ?? 0,
    anamnesis: anamnesisCount ?? 0,
    anthropometry: anthropometryCount ?? 0,
  };
}
