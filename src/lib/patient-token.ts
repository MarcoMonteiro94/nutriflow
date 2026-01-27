import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const TOKEN_COOKIE_NAME = "patient_token";
const TOKEN_EXPIRY_DAYS = 30;

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a new patient access token
 */
export async function createPatientToken(patientId: string): Promise<string> {
  const supabase = await createClient();

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  // Delete any existing tokens for this patient
  await supabase
    .from("patient_tokens")
    .delete()
    .eq("patient_id", patientId);

  // Create new token
  const { error } = await supabase
    .from("patient_tokens")
    .insert({
      patient_id: patientId,
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error(`Failed to create patient token: ${error.message}`);
  }

  return token;
}

/**
 * Verify a patient token and return patient data if valid
 */
export async function verifyPatientToken(token: string): Promise<{
  valid: boolean;
  patientId?: string;
  error?: string;
}> {
  // Use service client to bypass RLS - patients are not authenticated
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("patient_tokens")
    .select("patient_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    return { valid: false, error: "Token inválido ou expirado" };
  }

  // Check if token is expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return { valid: false, error: "Token expirado" };
  }

  return { valid: true, patientId: data.patient_id };
}

/**
 * Set the patient token cookie
 */
export async function setPatientTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60, // 30 days in seconds
    path: "/",
  });
}

/**
 * Get the patient token from cookie
 */
export async function getPatientTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value;
}

/**
 * Clear the patient token cookie
 */
export async function clearPatientTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

/**
 * Get the current patient ID from cookie token
 */
export async function getCurrentPatientId(): Promise<string | null> {
  const token = await getPatientTokenCookie();

  if (!token) {
    return null;
  }

  const result = await verifyPatientToken(token);

  if (!result.valid || !result.patientId) {
    return null;
  }

  return result.patientId;
}

/**
 * Get patient plan data using the RPC function (bypasses RLS)
 */
export async function getPatientPlanByToken(token: string): Promise<{
  error?: string;
  patient_id?: string;
  plan?: {
    id: string;
    title: string | null;
    description: string | null;
    starts_at: string | null;
    ends_at: string | null;
    meals: Array<{
      id: string;
      title: string;
      time: string;
      notes: string | null;
      meal_contents: Array<{
        id: string;
        amount: number;
        is_substitution: boolean;
        parent_content_id: string | null;
        food_item: {
          id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          portion_size: number | null;
          portion_unit: string | null;
        };
      }>;
    }>;
  } | null;
}> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_patient_plan_by_token", {
    p_token: token,
  });

  if (error) {
    console.error("RPC error:", error);
    return { error: "Erro ao carregar plano" };
  }

  return data as {
    error?: string;
    patient_id?: string;
    plan?: {
      id: string;
      title: string | null;
      description: string | null;
      starts_at: string | null;
      ends_at: string | null;
      meals: Array<{
        id: string;
        title: string;
        time: string;
        notes: string | null;
        meal_contents: Array<{
          id: string;
          amount: number;
          is_substitution: boolean;
          parent_content_id: string | null;
          food_item: {
            id: string;
            name: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            portion_size: number | null;
            portion_unit: string | null;
          };
        }>;
      }>;
    } | null;
  };
}

/**
 * Generate the magic link URL for a patient
 */
export function generateMagicLinkUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/patient/access?token=${token}`;
}

/**
 * Get patient plan data for an authenticated user (bypasses RLS with service client)
 */
export async function getPatientPlanByUserId(userId: string): Promise<{
  error?: string;
  patient_id?: string;
  plan?: {
    id: string;
    title: string | null;
    description: string | null;
    starts_at: string | null;
    ends_at: string | null;
    meals: Array<{
      id: string;
      title: string;
      time: string;
      notes: string | null;
      meal_contents: Array<{
        id: string;
        amount: number;
        is_substitution: boolean;
        parent_content_id: string | null;
        food_item: {
          id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          portion_size: number | null;
          portion_unit: string | null;
        };
      }>;
    }>;
  } | null;
}> {
  const supabase = createServiceClient();

  // First, get the patient linked to this user
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (patientError || !patient) {
    return { error: "Paciente não encontrado" };
  }

  // Get the active meal plan for this patient
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select(`
      id,
      title,
      description,
      starts_at,
      ends_at,
      meals (
        id,
        title,
        time,
        notes,
        meal_contents (
          id,
          amount,
          is_substitution,
          parent_content_id,
          food_item:food_items (
            id,
            name,
            calories,
            protein,
            carbs,
            fat,
            portion_size,
            portion_unit
          )
        )
      )
    `)
    .eq("patient_id", patient.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (planError) {
    // No plan found is not an error, just return null
    if (planError.code === "PGRST116") {
      return { patient_id: patient.id, plan: null };
    }
    console.error("Error fetching plan:", planError);
    return { error: "Erro ao carregar plano" };
  }

  // Sort meals by time
  const sortedMeals = plan.meals?.sort((a, b) => a.time.localeCompare(b.time)) || [];

  return {
    patient_id: patient.id,
    plan: {
      ...plan,
      meals: sortedMeals.map(meal => ({
        ...meal,
        meal_contents: meal.meal_contents || []
      }))
    }
  };
}
