import { NextRequest, NextResponse } from "next/server";
import { verifyPatientToken, setPatientTokenCookie } from "@/lib/patient-token";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/patient?error=missing_token", request.url));
  }

  // Verify the token
  const result = await verifyPatientToken(token);

  if (!result.valid || !result.patientId) {
    return NextResponse.redirect(new URL("/patient?error=invalid_token", request.url));
  }

  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in - redirect back to choose page
    return NextResponse.redirect(
      new URL(`/patient/access/choose?token=${token}`, request.url)
    );
  }

  // Use service client to bypass RLS for linking
  // (patient can't update their record when user_id is still NULL)
  const serviceClient = createServiceClient();

  // Link the user account to the patient record
  const { error: updateError } = await serviceClient
    .from("patients")
    .update({ user_id: user.id })
    .eq("id", result.patientId)
    .is("user_id", null); // Only update if not already linked

  if (updateError) {
    console.error("Error linking patient account:", updateError);
  }

  // Set the token cookie
  await setPatientTokenCookie(token);

  // Redirect to the patient dashboard (authenticated experience)
  return NextResponse.redirect(new URL("/patient/dashboard", request.url));
}
