"use client";

import { useState } from "react";
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
import type { Measurement } from "@/types/database";

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

  const isEditing = !!measurementId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Selecione uma data.");
      return;
    }

    // At least one measurement is required
    if (!weight && !height && !bodyFat && !muscleMass && !waist && !hip) {
      setError("Preencha pelo menos uma medida.");
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

      router.push(`/patients/${patientId}/measurements`);
      router.refresh();
    } catch (err) {
      console.error("Error saving measurement:", err);
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
