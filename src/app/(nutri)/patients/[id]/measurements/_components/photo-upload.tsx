"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface PhotoUploadProps {
  patientId: string;
}

export function PhotoUpload({ patientId }: PhotoUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"front" | "side" | "back">("front");
  const [isUploading, setIsUploading] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato de arquivo não suportado. Use JPG, PNG, WEBP ou HEIC.");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. O tamanho máximo é 10MB.");
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Selecione uma imagem para enviar.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", patientId);

      const response = await fetch("/api/measurements/photos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      toast.success("Foto enviada com sucesso!");

      // Reset form
      handleRemoveFile();
      setViewType("front");

      // Refresh the page to show the new photo
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload da foto");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload de Foto de Progresso
        </CardTitle>
        <CardDescription>
          Adicione fotos para acompanhar o progresso visual do paciente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="view-type">Tipo de Vista</Label>
          <Select value={viewType} onValueChange={(value) => setViewType(value as "front" | "side" | "back")}>
            <SelectTrigger id="view-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Frontal</SelectItem>
              <SelectItem value="side">Lateral</SelectItem>
              <SelectItem value="back">Costas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="photo">Foto</Label>
          <div className="flex flex-col gap-4">
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-gray-400 transition-colors"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 text-center">
                  Clique para selecionar uma imagem
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, WEBP ou HEIC (máx. 10MB)
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200">
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
                  className="absolute top-2 right-2"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Input
              ref={fileInputRef}
              id="photo"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Foto
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
