import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function validateImageFile(
  filename: string,
  sizeInBytes: number
): { valid: boolean; error?: string } {
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  const allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic"];
  const ext = filename.split(".").pop()?.toLowerCase();

  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Formato de arquivo não suportado. Use: ${allowedExtensions.join(", ")}`,
    };
  }

  if (sizeInBytes > maxSizeBytes) {
    return {
      valid: false,
      error: "Arquivo muito grande. O tamanho máximo é 10MB.",
    };
  }

  return { valid: true };
}

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

    // Validate file
    const validation = validateImageFile(file.name, file.size);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/${patientId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("measurement-photos")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
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
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
