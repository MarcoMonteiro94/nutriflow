"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GoalFormData, GoalType, MetricType } from "@/types/database";

const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: "checkin", label: "Confirmação" },
  { value: "photo", label: "Foto" },
  { value: "metric", label: "Métrica" },
];

const METRIC_TYPES: { value: MetricType; label: string; unit: string }[] = [
  { value: "weight", label: "Peso", unit: "kg" },
  { value: "waist", label: "Cintura", unit: "cm" },
  { value: "hip", label: "Quadril", unit: "cm" },
  { value: "body_fat", label: "% Gordura", unit: "%" },
  { value: "water", label: "Água", unit: "L" },
];

interface GoalFormProps {
  goal: GoalFormData;
  index: number;
  onChange: (index: number, goal: GoalFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function GoalForm({
  goal,
  index,
  onChange,
  onRemove,
  canRemove,
}: GoalFormProps) {
  function handleFieldChange<K extends keyof GoalFormData>(
    field: K,
    value: GoalFormData[K]
  ) {
    const updated = { ...goal, [field]: value };

    // Clear metric_type if type is not metric
    if (field === "type" && value !== "metric") {
      updated.metric_type = undefined;
    }

    onChange(index, updated);
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Meta {index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Título */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`goal-title-${index}`}>Título *</Label>
          <Input
            id={`goal-title-${index}`}
            value={goal.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="Ex: Foto do almoço"
          />
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label htmlFor={`goal-type-${index}`}>Tipo *</Label>
          <Select
            value={goal.type}
            onValueChange={(value: GoalType) =>
              handleFieldChange("type", value)
            }
          >
            <SelectTrigger id={`goal-type-${index}`}>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {GOAL_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Métrica (só se type = metric) */}
        {goal.type === "metric" && (
          <div className="space-y-2">
            <Label htmlFor={`goal-metric-${index}`}>Métrica *</Label>
            <Select
              value={goal.metric_type || ""}
              onValueChange={(value: MetricType) =>
                handleFieldChange("metric_type", value)
              }
            >
              <SelectTrigger id={`goal-metric-${index}`}>
                <SelectValue placeholder="Selecione a métrica" />
              </SelectTrigger>
              <SelectContent>
                {METRIC_TYPES.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label} ({metric.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Duração */}
        <div className="space-y-2">
          <Label htmlFor={`goal-duration-${index}`}>Duração (dias) *</Label>
          <Input
            id={`goal-duration-${index}`}
            type="number"
            min={1}
            max={365}
            value={goal.duration_days}
            onChange={(e) =>
              handleFieldChange("duration_days", parseInt(e.target.value) || 21)
            }
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`goal-description-${index}`}>
            Descrição (opcional)
          </Label>
          <Textarea
            id={`goal-description-${index}`}
            value={goal.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            placeholder="Instruções ou detalhes sobre a meta..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

// Helper to create a new empty goal
export function createEmptyGoal(): GoalFormData {
  return {
    title: "",
    type: "checkin",
    duration_days: 21,
  };
}
