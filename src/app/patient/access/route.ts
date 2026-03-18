import { NextRequest, NextResponse } from "next/server";
import { verifyPatientToken } from "@/lib/patient-token";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/patient?error=missing_token", request.url));
  }

  // Rate limit token verification by IP to prevent brute-force
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`token:${ip}`, RATE_LIMITS.auth);
  if (!rl.allowed) {
    return NextResponse.redirect(new URL("/patient?error=rate_limited", request.url));
  }

  // Verify the token
  const result = await verifyPatientToken(token);

  if (!result.valid) {
    return NextResponse.redirect(new URL("/patient?error=invalid_token", request.url));
  }

  // Token is valid - redirect to choice page
  return NextResponse.redirect(new URL(`/patient/access/choose?token=${token}`, request.url));
}
