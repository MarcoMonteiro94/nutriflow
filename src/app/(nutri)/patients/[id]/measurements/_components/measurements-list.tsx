"use client";

import { Button } from "@/components/ui/button";
import { Calendar, MoreHorizontal, Pencil, Trash2, Scale } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Measurement } from "@/types/database";

interface MeasurementsListProps {
  measurements: Measurement[];
  patientId: string;
}

export function MeasurementsList({ measurements, patientId }: MeasurementsListProps) {
  if (measurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Scale className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">
          Nenhuma medida registrada
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Registre a primeira medida do paciente.
        </p>
        <Button asChild className="mt-4">
          <Link href={`/patients/${patientId}/measurements/new`}>Nova Medida</Link>
        </Button>
      </div>
    );
  }

  // Show measurements in reverse chronological order
  const sortedMeasurements = [...measurements].reverse();

  return (
    <div className="space-y-4">
      {sortedMeasurements.map((measurement) => (
        <div
          key={measurement.id}
          className="flex items-start justify-between rounded-lg border p-4"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(measurement.measured_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
              {measurement.weight && (
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="font-medium">{measurement.weight} kg</p>
                </div>
              )}
              {measurement.height && (
                <div>
                  <p className="text-xs text-muted-foreground">Altura</p>
                  <p className="font-medium">{measurement.height} cm</p>
                </div>
              )}
              {measurement.body_fat_percentage && (
                <div>
                  <p className="text-xs text-muted-foreground">% Gordura</p>
                  <p className="font-medium">{measurement.body_fat_percentage}%</p>
                </div>
              )}
              {measurement.muscle_mass && (
                <div>
                  <p className="text-xs text-muted-foreground">Massa Muscular</p>
                  <p className="font-medium">{measurement.muscle_mass} kg</p>
                </div>
              )}
              {measurement.waist_circumference && (
                <div>
                  <p className="text-xs text-muted-foreground">Cintura</p>
                  <p className="font-medium">{measurement.waist_circumference} cm</p>
                </div>
              )}
              {measurement.hip_circumference && (
                <div>
                  <p className="text-xs text-muted-foreground">Quadril</p>
                  <p className="font-medium">{measurement.hip_circumference} cm</p>
                </div>
              )}
            </div>

            {measurement.notes && (
              <p className="text-sm text-muted-foreground">{measurement.notes}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/patients/${patientId}/measurements/${measurement.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
