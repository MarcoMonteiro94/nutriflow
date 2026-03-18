/**
 * Validate required environment variables at startup.
 * Import this in the root layout to fail fast on missing config.
 */

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;


export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  return { valid: missing.length === 0, missing };
}

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Validate on module load in production
if (process.env.NODE_ENV === "production") {
  const { valid, missing } = validateEnv();
  if (!valid) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
