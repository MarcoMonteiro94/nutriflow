"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Measurement, CustomMeasurementType, CustomMeasurementValue } from "@/types/database";

interface MeasurementFormProps {
  patientId: string;
  measurementId?: string;
  initialData?: Partial<Measurement>;
}

export function MeasurementForm({
  patientId,
  measurementId,
  initialData,
}: MeasurementFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<Date | undefined>(
    initialData?.measured_at ? new Date(initialData.measured_at) : new Date()
  );
  const [weight, setWeight] = useState(initialData?.weight?.toString() || "");
  const [height, setHeight] = useState(initialData?.height?.toString() || "");
  const [bodyFat, setBodyFat] = useState(initialData?.body_fat_percentage?.toString() || "");
  const [muscleMass, setMuscleMass] = useState(initialData?.muscle_mass?.toString() || "");
  const [waist, setWaist] = useState(initialData?.waist_circumference?.toString() || "");
  const [hip, setHip] = useState(initialData?.hip_circumference?.toString() || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Custom measurements state
  const [customTypes, setCustomTypes] = useState<CustomMeasurementType[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [isLoadingCustomTypes, setIsLoadingCustomTypes] = useState(true);

  const isEditing = !!measurementId;

  // Load custom measurement types and existing values
  useEffect(() => {
    async function loadCustomData() {
      const supabase = createClient();

      // Get current user (nutritionist)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingCustomTypes(false);
        return;
      }

      // Fetch custom measurement types for this nutritionist
      const { data: types, error: typesError } = await supabase
        .from("custom_measurement_types")
        .select("*")
        .eq("nutri_id", user.id)
        .order("name");

      if (typesError) {
        setIsLoadingCustomTypes(false);
        return;
      }

      setCustomTypes((types ?? []) as CustomMeasurementType[]);

      // If editing, fetch existing custom values for this measurement date and patient
      if (isEditing && initialData?.measured_at) {
        const { data: values, error: valuesError } = await supabase
          .from("custom_measurement_values")
          .select("*")
          .eq("patient_id", patientId)
          .eq("measured_at", initialData.measured_at);

        if (!valuesError && values) {
          const valueMap: Record<string, string> = {};
          (values as CustomMeasurementValue[]).forEach((v) => {
            valueMap[v.type_id] = v.value.toString();
          });
          setCustomValues(valueMap);
        }
      }

      setIsLoadingCustomTypes(false);
    }

    loadCustomData();
  }, [patientId, measurementId, initialData?.measured_at, isEditing]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Selecione uma data.");
      return;
    }

    // Check if at least one measurement (standard or custom) is filled
    const hasStandardMeasurement = weight || height || bodyFat || muscleMass || waist || hip;
    const hasCustomMeasurement = Object.values(customValues).some((val) => val.trim() !== "");

    if (!hasStandardMeasurement && !hasCustomMeasurement) {
      setError("Preencha pelo menos uma medida (padrão ou personalizada).");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const measurementData = {
        patient_id: patientId,
        measured_at: date.toISOString(),
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
        muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
        waist_circumference: waist ? parseFloat(waist) : null,
        hip_circumference: hip ? parseFloat(hip) : null,
        notes: notes || null,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("measurements")
          .update(measurementData)
          .eq("id", measurementId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("measurements")
          .insert(measurementData);

        if (insertError) {
          throw insertError;
        }
      }

      // Save custom measurement values
      if (hasCustomMeasurement) {
        // First, delete existing custom values for this patient and date (if editing)
        if (isEditing && initialData?.measured_at) {
          await supabase
            .from("custom_measurement_values")
            .delete()
            .eq("patient_id", patientId)
            .eq("measured_at", initialData.measured_at);
        }

        // Insert new custom values
        const customValuesToInsert = Object.entries(customValues)
          .filter(([_, value]) => value.trim() !== "")
          .map(([typeId, value]) => ({
            patient_id: patientId,
            type_id: typeId,
            value: parseFloat(value),
            measured_at: date.toISOString(),
          }));

        if (customValuesToInsert.length > 0) {
          const { error: customError } = await supabase
            .from("custom_measurement_values")
            .insert(customValuesToInsert);

          if (customError) {
            throw customError;
          }
        }
      }

      router.push(`/patients/${patientId}/measurements`);
      router.refresh();
    } catch (err) {
      setError("Erro ao salvar medida. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>Data da Medida *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                format(date, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="0"
            max="500"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ex: 75.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            min="0"
            max="300"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Ex: 175"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bodyFat">% Gordura Corporal</Label>
          <Input
            id="bodyFat"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="Ex: 18.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
          <Input
            id="muscleMass"
            type="number"
            step="0.1"
            min="0"
            max="200"
            value={muscleMass}
            onChange={(e) => setMuscleMass(e.target.value)}
            placeholder="Ex: 35.2"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="waist">Circunferência da Cintura (cm)</Label>
          <Input
            id="waist"
            type="number"
            step="0.1"
            min="0"
            max="300"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            placeholder="Ex: 80"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hip">Circunferência do Quadril (cm)</Label>
          <Input
            id="hip"
            type="number"
            step="0.1"
            min="0"
            max="300"
            value={hip}
            onChange={(e) => setHip(e.target.value)}
            placeholder="Ex: 95"
          />
        </div>
      </div>

      {/* Custom Measurements Section */}
      {!isLoadingCustomTypes && customTypes.length > 0 && (
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">Medidas Personalizadas</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {customTypes.map((type) => (
              <div key={type.id} className="space-y-2">
                <Label htmlFor={`custom-${type.id}`}>
                  {type.name} ({type.unit})
                </Label>
                <Input
                  id={`custom-${type.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={customValues[type.id] || ""}
                  onChange={(e) =>
                    setCustomValues((prev) => ({
                      ...prev,
                      [type.id]: e.target.value,
                    }))
                  }
                  placeholder={`Digite o valor em ${type.unit}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações sobre a medição (opcional)"
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar Alterações" : "Registrar Medida"}
        </Button>
      </div>
    </form>
  );
}
