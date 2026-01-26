"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeftRight, X } from "lucide-react";
import Image from "next/image";
import type { MeasurementPhoto } from "@/types/database";

interface PhotoComparisonProps {
  photos: MeasurementPhoto[];
}

const VIEW_TYPE_LABELS = {
  front: "Frontal",
  side: "Lateral",
  back: "Costas",
};

export function PhotoComparison({ photos }: PhotoComparisonProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // Sort photos by upload date (newest first)
  const sortedPhotos = useMemo(() => {
    return [...photos].sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
  }, [photos]);

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      // If already selected, remove it
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      // If less than 2 selected, add it
      if (prev.length < 2) {
        return [...prev, photoId];
      }
      // If 2 already selected, replace the oldest selection
      return [prev[1], photoId];
    });
  };

  const clearSelection = () => {
    setSelectedPhotos([]);
  };

  const isComparing = selectedPhotos.length === 2;
  const comparisonPhotos = useMemo(() => {
    if (!isComparing) return [];
    return selectedPhotos
      .map((id) => sortedPhotos.find((p) => p.id === id))
      .filter((p): p is MeasurementPhoto => p !== undefined);
  }, [isComparing, selectedPhotos, sortedPhotos]);

  if (photos.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Nenhuma foto adicionada ainda. Adicione fotos para acompanhar o progresso visual.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comparison view */}
      {isComparing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Comparação de Fotos
                </CardTitle>
                <CardDescription>
                  Compare duas fotos lado a lado para visualizar a evolução
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4 mr-2" />
                Limpar Seleção
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisonPhotos.map((photo) => (
                <div key={photo.id} className="space-y-2">
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={photo.photo_url}
                      alt={`Foto ${photo.view_type ? VIEW_TYPE_LABELS[photo.view_type as keyof typeof VIEW_TYPE_LABELS] : ""}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {format(new Date(photo.uploaded_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {photo.view_type && (
                      <p className="text-sm text-muted-foreground">
                        Vista: {VIEW_TYPE_LABELS[photo.view_type as keyof typeof VIEW_TYPE_LABELS]}
                      </p>
                    )}
                    {photo.notes && (
                      <p className="text-sm text-muted-foreground">
                        {photo.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo gallery */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedPhotos.length === 0
              ? "Selecione até 2 fotos para comparar"
              : selectedPhotos.length === 1
                ? "Selecione mais uma foto para comparar"
                : "2 fotos selecionadas para comparação"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedPhotos.map((photo) => {
            const isSelected = selectedPhotos.includes(photo.id);
            return (
              <button
                key={photo.id}
                onClick={() => togglePhotoSelection(photo.id)}
                className={`group relative aspect-[3/4] rounded-lg overflow-hidden transition-all ${
                  isSelected
                    ? "ring-4 ring-blue-500 ring-offset-2"
                    : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-2"
                }`}
              >
                <Image
                  src={photo.photo_url}
                  alt={`Foto ${photo.view_type ? VIEW_TYPE_LABELS[photo.view_type as keyof typeof VIEW_TYPE_LABELS] : ""}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-100 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="text-xs font-medium">
                      {format(new Date(photo.uploaded_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {photo.view_type && (
                      <p className="text-xs opacity-90">
                        {VIEW_TYPE_LABELS[photo.view_type as keyof typeof VIEW_TYPE_LABELS]}
                      </p>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {selectedPhotos.indexOf(photo.id) + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
