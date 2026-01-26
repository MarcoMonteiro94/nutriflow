import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMeasurementPDF } from "@/lib/measurements/export-pdf";
import type { Patient, Measurement } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Get patient ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "ID do paciente não fornecido" },
        { status: 400 }
      );
    }

    // Validate the patient belongs to this nutri
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .eq("nutri_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    // Fetch measurements for the patient
    const { data: measurements, error: measurementsError } = await supabase
      .from("measurements")
      .select("*")
      .eq("patient_id", patientId)
      .order("measured_at", { ascending: true });

    if (measurementsError) {
      return NextResponse.json(
        { error: "Erro ao buscar medidas" },
        { status: 500 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateMeasurementPDF(patient as Patient, (measurements ?? []) as Measurement[]);

    // Return PDF file
    const typedPatient = patient as Patient;
    const fileName = `medidas_${typedPatient.full_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
