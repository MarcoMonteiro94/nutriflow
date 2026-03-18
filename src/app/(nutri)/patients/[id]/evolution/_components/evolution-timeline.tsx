"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Ruler, Scale } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { UnifiedDataPoint } from "./evolution-chart";

interface EvolutionTimelineProps {
  data: UnifiedDataPoint[];
  patientId: string;
}

export function EvolutionTimeline({ data, patientId }: EvolutionTimelineProps) {
  // Reverse to show most recent first
  const sorted = [...data].reverse();

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum registro encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((point, i) => {
        const isAnthro = point.source === "anthropometry";
        const href = isAnthro
          ? `/patients/${patientId}/anthropometry`
          : `/patients/${patientId}/measurements`;

        return (
          <Link
            key={`${point.source}-${point.date}-${i}`}
            href={href}
            className="flex items-center gap-4 rounded-xl border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isAnthro ? "bg-violet-500/10 text-violet-500" : "bg-sky-500/10 text-sky-500"
            }`}>
              {isAnthro ? <Ruler className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {format(new Date(point.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <Badge variant="outline" className="text-[10px]">
                  {isAnthro ? "Antropometria" : "Medida"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                {point.weight && <span>Peso: {point.weight}kg</span>}
                {point.bmi && <span>IMC: {point.bmi.toFixed(1)}</span>}
                {point.body_fat && <span>Gordura: {point.body_fat}%</span>}
                {point.muscle_mass && <span>Massa: {point.muscle_mass}kg</span>}
                {point.waist && <span>Cintura: {point.waist}cm</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
