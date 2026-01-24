"use client";

import { Button } from "@/components/ui/button";
import { Calendar, MoreHorizontal, Pencil, Trash2, Ruler } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AnthropometryAssessment } from "@/types/database";

interface AnthropometryListProps {
  assessments: AnthropometryAssessment[];
  patientId: string;
}

export function AnthropometryList({ assessments, patientId }: AnthropometryListProps) {
  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Ruler className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">
          Nenhuma avaliação registrada
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Registre a primeira avaliação antropométrica do paciente.
        </p>
        <Button asChild className="mt-4">
          <Link href={`/patients/${patientId}/anthropometry/new`}>Nova Avaliação</Link>
        </Button>
      </div>
    );
  }

  // Show assessments in reverse chronological order
  const sortedAssessments = [...assessments].reverse();

  return (
    <div className="space-y-4">
      {sortedAssessments.map((assessment) => (
        <div
          key={assessment.id}
          className="flex items-start justify-between rounded-lg border p-4"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(assessment.assessed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>

            {/* Main calculated metrics */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
              {assessment.bmi && (
                <div>
                  <p className="text-xs text-muted-foreground">IMC</p>
                  <p className="font-medium">{assessment.bmi.toFixed(1)} kg/m²</p>
                </div>
              )}
              {assessment.body_fat_percentage && (
                <div>
                  <p className="text-xs text-muted-foreground">% Gordura</p>
                  <p className="font-medium">{assessment.body_fat_percentage.toFixed(1)}%</p>
                </div>
              )}
              {assessment.waist_hip_ratio && (
                <div>
                  <p className="text-xs text-muted-foreground">RCQ</p>
                  <p className="font-medium">{assessment.waist_hip_ratio.toFixed(2)}</p>
                </div>
              )}
              {assessment.weight && (
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="font-medium">{assessment.weight} kg</p>
                </div>
              )}
            </div>

            {/* Circumferences summary */}
            {(assessment.waist_circumference || assessment.hip_circumference || assessment.right_arm_circumference) && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                {assessment.waist_circumference && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cintura</p>
                    <p className="font-medium">{assessment.waist_circumference} cm</p>
                  </div>
                )}
                {assessment.hip_circumference && (
                  <div>
                    <p className="text-xs text-muted-foreground">Quadril</p>
                    <p className="font-medium">{assessment.hip_circumference} cm</p>
                  </div>
                )}
                {assessment.right_arm_circumference && (
                  <div>
                    <p className="text-xs text-muted-foreground">Braço D.</p>
                    <p className="font-medium">{assessment.right_arm_circumference} cm</p>
                  </div>
                )}
                {assessment.chest_circumference && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tórax</p>
                    <p className="font-medium">{assessment.chest_circumference} cm</p>
                  </div>
                )}
              </div>
            )}

            {assessment.notes && (
              <p className="text-sm text-muted-foreground">{assessment.notes}</p>
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
                <Link href={`/patients/${patientId}/anthropometry/${assessment.id}/edit`}>
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
