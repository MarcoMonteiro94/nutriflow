"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { MetricType } from "@/types/database";

const METRIC_CONFIG: Record<MetricType, { label: string; unit: string; field: string | null }> = {
  weight: { label: "Peso", unit: "kg", field: "weight" },
  waist: { label: "Cintura", unit: "cm", field: "waist_circumference" },
  hip: { label: "Quadril", unit: "cm", field: "hip_circumference" },
  body_fat: { label: "Gordura Corporal", unit: "%", field: "body_fat_percentage" },
  water: { label: "Consumo de Água", unit: "L", field: null }, // Not in measurements table
};

interface MetricInputProps {
  metricType: MetricType;
  patientId: string;
  value: string;
  onChange: (value: string) => void;
}

export function MetricInput({
  metricType,
  patientId,
  value,
  onChange,
}: MetricInputProps) {
  const [isLoadingMeasurement, setIsLoadingMeasurement] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const config = METRIC_CONFIG[metricType];

  // Try to prefill from today's measurement
  useEffect(() => {
    async function loadTodaysMeasurement() {
      if (!config.field || value) return;

      setIsLoadingMeasurement(true);
      try {
        const supabase = createClient();
        const today = new Date().toISOString().split("T")[0];

        const { data } = await supabase
          .from("measurements")
          .select("*")
          .eq("patient_id", patientId)
          .gte("measured_at", `${today}T00:00:00`)
          .lte("measured_at", `${today}T23:59:59`)
          .order("measured_at", { ascending: false })
          .limit(1)
          .single();

        if (data && config.field) {
          const fieldValue = (data as any)[config.field];
          if (fieldValue != null) {
            onChange(fieldValue.toString());
            setPrefilled(true);
          }
        }
      } catch {
        // No measurement found for today, that's ok
      } finally {
        setIsLoadingMeasurement(false);
      }
    }

    loadTodaysMeasurement();
  }, [patientId, config.field, value, onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="metric-value" className="flex items-center gap-2">
        {config.label}
        {isLoadingMeasurement && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
        {prefilled && !isLoadingMeasurement && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            Preenchido da medição de hoje
          </span>
        )}
      </Label>
      <div className="relative">
        <Input
          id="metric-value"
          type="number"
          step="0.1"
          min="0"
          placeholder={`Ex: ${metricType === "weight" ? "72.5" : metricType === "water" ? "2.0" : "80"}`}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (prefilled) setPrefilled(false);
          }}
          className="pr-12"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {config.unit}
        </span>
      </div>
      {!config.field && (
        <p className="text-xs text-muted-foreground">
          Este valor será registrado apenas no desafio.
        </p>
      )}
    </div>
  );
}
