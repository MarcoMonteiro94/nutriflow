import { NextRequest, NextResponse } from "next/server";
import { verifyPatientToken } from "@/lib/patient-token";
import { cookies } from "next/headers";

const TOKEN_COOKIE_NAME = "patient_token";
const TOKEN_EXPIRY_DAYS = 30;

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

  // Token is valid - set the cookie
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  });

  // Redirect to the plan page
  return NextResponse.redirect(new URL("/patient/plan", request.url));
}
