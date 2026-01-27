import { NextRequest, NextResponse } from "next/server";
import { verifyPatientToken } from "@/lib/patient-token";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/patient?error=missing_token", request.url));
  }

  // Verify the token
  const result = await verifyPatientToken(token);

  if (!result.valid) {
    return NextResponse.redirect(new URL("/patient?error=invalid_token", request.url));
  }

  // Token is valid - redirect to choice page
  return NextResponse.redirect(new URL(`/patient/access/choose?token=${token}`, request.url));
}
