import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAudioFile } from "@/lib/ai/transcribe";
import { validateAudioMagicBytes } from "@/lib/file-validation";

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

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const patientId = formData.get("patientId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { error: "ID do paciente não fornecido" },
        { status: 400 }
      );
    }

    // Validate the patient belongs to this nutri
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

    // Validate file extension and size
    const validation = validateAudioFile(file.name, file.size);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Validate file content via magic bytes
    const fileBuffer = await file.arrayBuffer();
    if (!validateAudioMagicBytes(fileBuffer)) {
      return NextResponse.json(
        { error: "Formato de arquivo inválido" },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/${patientId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage (use buffer we already read)
    const { error: uploadError } = await supabase.storage
      .from("anamnesis-audio")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Erro ao fazer upload do arquivo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filePath,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
