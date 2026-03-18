import { createClient } from "@/lib/supabase/server";

/**
 * Verify that the authenticated user has access to a patient.
 * Checks both nutri ownership AND organizational context.
 * Returns the patient ID if valid, null otherwise.
 */
export async function verifyPatientAccess(
  patientId: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { valid: false, error: "Não autenticado" };
  }

  // Check direct ownership (nutri_id)
  const { data: patient } = await supabase
    .from("patients")
    .select("id, nutri_id, organization_id")
    .eq("id", patientId)
    .single();

  if (!patient) {
    return { valid: false, userId: user.id, error: "Paciente não encontrado" };
  }

  // Direct owner
  if (patient.nutri_id === user.id) {
    return { valid: true, userId: user.id };
  }

  // Check org membership (for receptionists/admins in the same org)
  if (patient.organization_id) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", patient.organization_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (membership) {
      return { valid: true, userId: user.id };
    }
  }

  return { valid: false, userId: user.id, error: "Sem permissão" };
}
