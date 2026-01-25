import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMeasurementCSV } from "@/lib/measurements/export-csv";

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
      .select("id, full_name")
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
      .select(`
        *,
        custom_measurement_values (
          *,
          custom_measurement_types (
            *
          )
        )
      `)
      .eq("patient_id", patientId)
      .order("measured_at", { ascending: true });

    if (measurementsError) {
      return NextResponse.json(
        { error: "Erro ao buscar medidas" },
        { status: 500 }
      );
    }

    // Generate CSV
    const csv = generateMeasurementCSV(measurements ?? []);

    // Return CSV file
    const fileName = `medidas_${patient.full_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
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
