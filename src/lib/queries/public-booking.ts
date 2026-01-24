import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Organization,
  OrganizationMember,
  Patient,
  Appointment,
  InsertTables,
} from "@/types/database";

export type InsertPatient = InsertTables<"patients">;
export type InsertAppointment = InsertTables<"appointments">;

// ============================================
// Public Nutritionist Info
// ============================================

export interface PublicNutriInfo {
  id: string;
  full_name: string;
  email: string;
}

export async function getPublicNutriInfo(
  nutriId: string
): Promise<PublicNutriInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", nutriId)
    .eq("role", "nutri")
    .single();

  if (error) {
    console.error("Error fetching public nutri info:", error);
    return null;
  }

  return data as PublicNutriInfo;
}

// ============================================
// Public Organization Info
// ============================================

export async function getPublicOrgInfo(
  orgSlug: string
): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", orgSlug)
    .single();

  if (error) {
    console.error("Error fetching public org info:", error);
    return null;
  }

  return data as Organization;
}

// ============================================
// Organization Nutritionists
// ============================================

export interface OrgNutritionist {
  id: string;
  full_name: string;
  email: string;
  member_id: string;
  role: string;
}

export async function getOrgNutritionists(
  orgId: string
): Promise<OrgNutritionist[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      role,
      user_id,
      profiles!organization_members_user_id_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .eq("organization_id", orgId)
    .eq("status", "active")
    .eq("role", "nutri");

  if (error) {
    console.error("Error fetching org nutritionists:", error);
    return [];
  }

  // Transform the data to flatten the structure
  const nutritionists = (data ?? [])
    .filter((member: any) => member.profiles)
    .map((member: any) => ({
      id: member.profiles.id,
      full_name: member.profiles.full_name,
      email: member.profiles.email,
      member_id: member.id,
      role: member.role,
    }));

  return nutritionists as OrgNutritionist[];
}

// ============================================
// Public Patient Creation
// ============================================

export interface PublicPatientData {
  full_name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export async function createPublicPatient(
  nutriId: string,
  patientData: PublicPatientData
): Promise<{ data: Patient | null; error: string | null }> {
  const supabase = await createClient();

  // Check if patient already exists by email for this nutritionist
  if (patientData.email) {
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("*")
      .eq("nutri_id", nutriId)
      .eq("email", patientData.email)
      .single();

    if (existingPatient) {
      return { data: existingPatient as Patient, error: null };
    }
  }

  // Create new patient
  const { data, error } = await supabase
    .from("patients")
    .insert({
      nutri_id: nutriId,
      full_name: patientData.full_name,
      email: patientData.email || null,
      phone: patientData.phone || null,
      notes: patientData.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating public patient:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Patient, error: null };
}

// ============================================
// Public Appointment Creation
// ============================================

export interface PublicAppointmentData {
  nutriId: string;
  patientId: string;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
  organizationId?: string;
}

export async function createPublicAppointment(
  appointmentData: PublicAppointmentData
): Promise<{ data: Appointment | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      nutri_id: appointmentData.nutriId,
      patient_id: appointmentData.patientId,
      scheduled_at: appointmentData.scheduledAt,
      duration_minutes: appointmentData.durationMinutes || 60,
      status: "scheduled",
      notes: appointmentData.notes || null,
      organization_id: appointmentData.organizationId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating public appointment:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Appointment, error: null };
}
