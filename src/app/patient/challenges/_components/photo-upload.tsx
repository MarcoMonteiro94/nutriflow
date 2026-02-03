"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, X, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";

interface PhotoUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
  isUploading?: boolean;
}

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Compress image using canvas
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Calculate new dimensions (max 1920px)
      const maxDimension = 1920;
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not compress image"));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/jpeg",
        0.8 // Quality 80%
      );
    };

    img.onerror = () => reject(new Error("Could not load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function PhotoUpload({
  onFileSelect,
  previewUrl,
  isUploading = false,
}: PhotoUploadProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setError(null);

      if (!file) {
        onFileSelect(null);
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione uma imagem.");
        return;
      }

      // Check original size
      if (file.size > MAX_FILE_SIZE * 2) {
        setError("Imagem muito grande. Máximo 4MB antes da compressão.");
        return;
      }

      setIsCompressing(true);
      try {
        // Compress the image
        const compressedFile = await compressImage(file);

        // Check compressed size
        if (compressedFile.size > MAX_FILE_SIZE) {
          setError("Imagem ainda muito grande após compressão. Tente uma imagem menor.");
          return;
        }

        onFileSelect(compressedFile);
      } catch (err) {
        setError("Erro ao processar imagem. Tente novamente.");
        console.error("Compression error:", err);
      } finally {
        setIsCompressing(false);
      }
    },
    [onFileSelect]
  );

  const handleRemove = () => {
    onFileSelect(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label>Foto</Label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading || isCompressing}
      />

      {/* Preview or upload button */}
      {previewUrl ? (
        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isCompressing}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-primary/50 hover:bg-muted disabled:opacity-50"
        >
          {isCompressing ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Processando imagem...</span>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Tirar foto ou escolher da galeria</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG ou HEIC (máx. 2MB)
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Uploading state */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Enviando foto...
        </div>
      )}
    </div>
  );
}
