import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processAnamnesisText } from "@/lib/ai/process-anamnesis";
import type { AnamnesisSourceType } from "@/types/anamnesis";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      patientId,
      transcript,
      sourceType,
      audioFilePath,
      audioDurationSeconds,
    } = body as {
      patientId: string;
      transcript: string;
      sourceType: AnamnesisSourceType;
      audioFilePath?: string;
      audioDurationSeconds?: number;
    };

    if (!patientId) {
      return NextResponse.json(
        { error: "ID do paciente não fornecido" },
        { status: 400 }
      );
    }

    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: "Transcrição muito curta. Forneça mais detalhes." },
        { status: 400 }
      );
    }

    if (!sourceType || !["audio", "text", "hybrid"].includes(sourceType)) {
      return NextResponse.json(
        { error: "Tipo de fonte inválido" },
        { status: 400 }
      );
    }

    // Verify the patient belongs to this nutri
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("nutri_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    // Process the transcript with AI
    const result = await processAnamnesisText(transcript);

    // Create the anamnesis report
    const insertData = {
      patient_id: patientId,
      nutri_id: user.id,
      source_type: sourceType as "audio" | "text" | "hybrid",
      original_transcript: transcript,
      audio_file_path: audioFilePath || null,
      audio_duration_seconds: audioDurationSeconds || null,
      ai_model_used: result.model_used,
      confidence_score: result.confidence_score,
      status: "review" as const,
      // Structured data
      chief_complaint: result.data.chief_complaint,
      history_present_illness: result.data.history_present_illness,
      past_medical_history: result.data.past_medical_history,
      family_history: result.data.family_history,
      social_history: result.data.social_history as Record<string, unknown>,
      dietary_history: result.data.dietary_history as Record<string, unknown>,
      current_medications: result.data.current_medications,
      supplements: result.data.supplements,
      goals: result.data.goals,
      observations: result.data.observations,
    };

    const { data: report, error: insertError } = await supabase
      .from("anamnesis_reports")
      .insert(insertData as any)
      .select()
      .single();

    if (insertError || !report) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Erro ao salvar o relatório" },
        { status: 500 }
      );
    }

    const reportData = report as { id: string };

    return NextResponse.json({
      success: true,
      reportId: reportData.id,
      confidenceScore: result.confidence_score,
    });
  } catch (error) {
    console.error("Processing error:", error);
    return NextResponse.json(
      { error: "Erro ao processar a anamnese" },
      { status: 500 }
    );
  }
}
