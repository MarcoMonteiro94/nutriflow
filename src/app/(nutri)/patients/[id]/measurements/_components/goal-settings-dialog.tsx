"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface GoalSettingsDialogProps {
  patientId: string;
}

type MetricType = "weight" | "body_fat_percentage" | "muscle_mass" | "waist_circumference";

const metricConfig: Record<MetricType, { label: string; unit: string }> = {
  weight: { label: "Peso", unit: "kg" },
  body_fat_percentage: { label: "% Gordura", unit: "%" },
  muscle_mass: { label: "Massa Muscular", unit: "kg" },
  waist_circumference: { label: "Cintura", unit: "cm" },
};

export function GoalSettingsDialog({ patientId }: GoalSettingsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricType, setMetricType] = useState<MetricType | "">("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!metricType) {
      setError("Selecione o tipo de métrica");
      setIsLoading(false);
      return;
    }

    if (!targetValue.trim() || isNaN(Number(targetValue))) {
      setError("Informe um valor válido para a meta");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado");
      setIsLoading(false);
      return;
    }

    // Verify patient ownership
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("nutri_id", user.id)
      .single();

    if (!patient) {
      setError("Paciente não encontrado");
      setIsLoading(false);
      return;
    }

    // Check if an active goal already exists for this metric
    const { data: existingGoal } = await (supabase as any)
      .from("measurement_goals")
      .select("id")
      .eq("patient_id", patientId)
      .eq("metric_type", metricType)
      .eq("is_active", true)
      .single();

    if (existingGoal) {
      // Update existing goal
      const { error: updateError } = await (supabase as any)
        .from("measurement_goals")
        .update({
          target_value: Number(targetValue),
          target_date: targetDate || null,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingGoal.id);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }
    } else {
      // Create new goal
      const { error: createError } = await (supabase as any)
        .from("measurement_goals")
        .insert({
          patient_id: patientId,
          metric_type: metricType,
          target_value: Number(targetValue),
          target_date: targetDate || null,
          notes: notes.trim() || null,
          is_active: true,
        });

      if (createError) {
        setError(createError.message);
        setIsLoading(false);
        return;
      }
    }

    setMetricType("");
    setTargetValue("");
    setTargetDate("");
    setNotes("");
    setOpen(false);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Target className="mr-2 h-4 w-4" />
          Definir Meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Definir Meta de Medida</DialogTitle>
            <DialogDescription>
              Configure uma meta para acompanhar o progresso do paciente. Se já existir uma meta ativa para a métrica escolhida, ela será atualizada.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive mt-4">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="metricType">Métrica *</Label>
              <Select value={metricType} onValueChange={(value) => setMetricType(value as MetricType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a métrica" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(metricConfig) as MetricType[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {metricConfig[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetValue">
                Valor da Meta * {metricType && `(${metricConfig[metricType as MetricType].unit})`}
              </Label>
              <Input
                id="targetValue"
                type="number"
                step="0.1"
                placeholder="Ex: 70"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Data da Meta (opcional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Meta de perda de peso para evento especial"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
