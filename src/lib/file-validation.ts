/**
 * Validate file content by checking magic bytes (file signatures).
 * This prevents attackers from bypassing extension/MIME type checks
 * by renaming malicious files.
 */

// Audio format magic bytes
const AUDIO_SIGNATURES: { ext: string; bytes: number[]; offset?: number }[] = [
  { ext: "mp3", bytes: [0xff, 0xfb] }, // MP3 frame sync
  { ext: "mp3", bytes: [0xff, 0xf3] }, // MP3 frame sync variant
  { ext: "mp3", bytes: [0xff, 0xf2] }, // MP3 frame sync variant
  { ext: "mp3", bytes: [0x49, 0x44, 0x33] }, // ID3 tag header
  { ext: "mp4", bytes: [0x00, 0x00, 0x00], offset: 0 }, // ftyp box (offset varies)
  { ext: "m4a", bytes: [0x00, 0x00, 0x00], offset: 0 }, // ftyp box
  { ext: "wav", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  { ext: "ogg", bytes: [0x4f, 0x67, 0x67, 0x53] }, // OggS
  { ext: "flac", bytes: [0x66, 0x4c, 0x61, 0x43] }, // fLaC
  { ext: "webm", bytes: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML (Matroska/WebM)
];

// Image format magic bytes
const IMAGE_SIGNATURES: { ext: string; bytes: number[] }[] = [
  { ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: "gif", bytes: [0x47, 0x49, 0x46] },
  { ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (with WEBP at offset 8)
  { ext: "heic", bytes: [0x00, 0x00, 0x00] }, // ftyp box
];

function checkSignature(
  buffer: Uint8Array,
  signature: { bytes: number[]; offset?: number }
): boolean {
  const offset = signature.offset ?? 0;
  if (buffer.length < offset + signature.bytes.length) return false;
  return signature.bytes.every((byte, i) => buffer[offset + i] === byte);
}

export function validateAudioMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer).slice(0, 16);
  return AUDIO_SIGNATURES.some((sig) => checkSignature(bytes, sig));
}

export function validateImageMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer).slice(0, 16);
  return IMAGE_SIGNATURES.some((sig) => checkSignature(bytes, sig));
}
