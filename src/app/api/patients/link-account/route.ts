import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { patientId, userId } = await request.json();

    if (!patientId || !userId) {
      return NextResponse.json(
        { error: "Patient ID e User ID são obrigatórios" },
        { status: 400 }
      );
    }

    // Verify the requesting user is authenticated and is a nutri
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Check if user is a nutri and owns this patient
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, nutri_id, user_id")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    if (patient.nutri_id !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão para este paciente" },
        { status: 403 }
      );
    }

    if (patient.user_id) {
      return NextResponse.json(
        { error: "Paciente já possui uma conta vinculada" },
        { status: 400 }
      );
    }

    // Check if userId is already linked to another patient (of this nutri)
    const { data: existingLink } = await supabase
      .from("patients")
      .select("id, full_name")
      .eq("user_id", userId)
      .eq("nutri_id", user.id)
      .single();

    if (existingLink) {
      return NextResponse.json(
        { error: `Este usuário já está vinculado ao paciente ${existingLink.full_name}` },
        { status: 400 }
      );
    }

    // Use service role to update (bypasses RLS for the update)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Link the account
    const { error: updateError } = await serviceClient
      .from("patients")
      .update({ user_id: userId })
      .eq("id", patientId);

    if (updateError) {
      console.error("Error linking account:", updateError);
      return NextResponse.json(
        { error: "Erro ao vincular conta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Link account error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
