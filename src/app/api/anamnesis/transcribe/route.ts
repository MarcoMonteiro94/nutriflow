import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/ai/transcribe";

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
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "Caminho do arquivo não fornecido" },
        { status: 400 }
      );
    }

    // Verify the file belongs to this user
    if (!filePath.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: "Acesso negado ao arquivo" },
        { status: 403 }
      );
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("anamnesis-audio")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return NextResponse.json(
        { error: "Erro ao baixar o arquivo" },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = filePath.split("/").pop() || "audio.webm";

    // Transcribe the audio
    const result = await transcribeAudio(buffer, filename);

    return NextResponse.json({
      success: true,
      transcript: result.text,
      duration_seconds: result.duration_seconds,
      language: result.language,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Erro ao transcrever o áudio" },
      { status: 500 }
    );
  }
}
