import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

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
 * Generate the magic link URL for a patient
 */
export function generateMagicLinkUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/patient/access?token=${token}`;
}
