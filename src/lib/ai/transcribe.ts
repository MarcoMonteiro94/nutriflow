import { getOpenAIClient } from "./openai";
import type { TranscriptionResult } from "@/types/anamnesis";

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<TranscriptionResult> {
  const openai = getOpenAIClient();

  // Create a File object from the buffer
  const uint8Array = new Uint8Array(audioBuffer);
  const audioFile = new File([uint8Array], filename, {
    type: getMimeType(filename),
  });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "pt", // Portuguese
    response_format: "verbose_json",
  });

  return {
    text: transcription.text,
    duration_seconds: Math.round(transcription.duration ?? 0),
    language: transcription.language ?? "pt",
  };
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "mp4":
    case "m4a":
      return "audio/mp4";
    case "wav":
      return "audio/wav";
    case "webm":
      return "audio/webm";
    case "ogg":
      return "audio/ogg";
    default:
      return "audio/mpeg";
  }
}

export function validateAudioFile(
  filename: string,
  sizeInBytes: number
): { valid: boolean; error?: string } {
  const maxSizeBytes = 50 * 1024 * 1024; // 50MB
  const allowedExtensions = ["mp3", "mp4", "m4a", "wav", "webm", "ogg", "flac"];
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
      error: "Arquivo muito grande. O tamanho máximo é 50MB.",
    };
  }

  return { valid: true };
}
