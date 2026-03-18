"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NutrientTargets {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface NutrientTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutrientCalculatorProps {
  targets: NutrientTargets;
  totals: NutrientTotals;
  suggestedTargets?: NutrientTotals | null;
  onUpdateTargets?: (targets: Partial<NutrientTargets>) => Promise<void>;
  readOnly?: boolean;
  mealCount: number;
}

const MACRO_ROWS = [
  { key: "calories" as const, label: "Calorias", unit: "kcal" },
  { key: "protein" as const, label: "Proteínas", unit: "g" },
  { key: "carbs" as const, label: "Carboidratos", unit: "g" },
  { key: "fat" as const, label: "Gorduras", unit: "g" },
];

export function NutrientCalculator({
  targets,
  totals,
  suggestedTargets,
  onUpdateTargets,
  readOnly = false,
  mealCount,
}: NutrientCalculatorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTargets, setEditTargets] = useState<NutrientTargets>(targets);
  const [isPending, startTransition] = useTransition();

  const hasTargets = targets.calories !== null;

  function handleApplySuggested() {
    if (!suggestedTargets || !onUpdateTargets) return;
    startTransition(async () => {
      await onUpdateTargets(suggestedTargets);
      setEditTargets(suggestedTargets);
    });
  }

  function handleStartEdit() {
    setEditTargets(targets);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditTargets(targets);
  }

  function handleSaveEdit() {
    if (!onUpdateTargets) return;
    startTransition(async () => {
      await onUpdateTargets(editTargets);
      setIsEditing(false);
    });
  }

  function handleEditChange(key: keyof NutrientTargets, value: string) {
    const num = value === "" ? null : Number(value);
    setEditTargets((prev) => ({ ...prev, [key]: num }));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calculadora de Nutrientes</CardTitle>
          {!readOnly && hasTargets && !isEditing && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStartEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCancelEdit}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={handleSaveEdit}
                disabled={isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTargets && !isEditing ? (
          <EmptyState
            suggestedTargets={suggestedTargets}
            onApplySuggested={!readOnly ? handleApplySuggested : undefined}
            onStartEdit={!readOnly ? handleStartEdit : undefined}
            isPending={isPending}
          />
        ) : (
          <>
            <div className="space-y-3">
              {MACRO_ROWS.map((row) => {
                const target = isEditing
                  ? editTargets[row.key]
                  : targets[row.key];
                const consumed = totals[row.key];

                return isEditing ? (
                  <EditRow
                    key={row.key}
                    label={row.label}
                    unit={row.unit}
                    value={editTargets[row.key]}
                    onChange={(v) => handleEditChange(row.key, v)}
                  />
                ) : (
                  <MacroRow
                    key={row.key}
                    label={row.label}
                    unit={row.unit}
                    target={target}
                    consumed={consumed}
                  />
                );
              })}
            </div>
            {!isEditing && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {mealCount} refeição{mealCount !== 1 ? "ões" : ""} no plano
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MacroRow({
  label,
  unit,
  target,
  consumed,
}: {
  label: string;
  unit: string;
  target: number | null;
  consumed: number;
}) {
  if (target === null || target === 0) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {consumed} {unit}
        </span>
      </div>
    );
  }

  const percentage = Math.min((consumed / target) * 100, 100);
  const remaining = target - consumed;
  const exceeded = remaining < 0;
  const atTarget = remaining === 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span
          className={cn(
            "tabular-nums",
            exceeded && "text-rose-500",
            atTarget && "text-emerald-500",
            !exceeded && !atTarget && "text-muted-foreground"
          )}
        >
          {consumed} / {target} {unit}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            exceeded ? "bg-rose-500" : "bg-primary"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p
        className={cn(
          "text-xs",
          exceeded && "text-rose-500",
          atTarget && "text-emerald-500",
          !exceeded && !atTarget && "text-muted-foreground"
        )}
      >
        {exceeded
          ? `${Math.abs(remaining)} ${unit} acima da meta`
          : atTarget
          ? "Meta atingida"
          : `${remaining} ${unit} restantes`}
      </p>
    </div>
  );
}

function EditRow({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-28 shrink-0">{label}</span>
      <Input
        type="number"
        min={0}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
        placeholder="0"
      />
      <span className="text-xs text-muted-foreground w-8 shrink-0">{unit}</span>
    </div>
  );
}

function EmptyState({
  suggestedTargets,
  onApplySuggested,
  onStartEdit,
  isPending,
}: {
  suggestedTargets?: NutrientTotals | null;
  onApplySuggested?: () => void;
  onStartEdit?: () => void;
  isPending: boolean;
}) {
  return (
    <div className="text-center py-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Nenhuma meta nutricional configurada.
      </p>
      {suggestedTargets && onApplySuggested && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Sugestão baseada no TMB/TDEE do paciente:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-muted-foreground">Calorias: {suggestedTargets.calories} kcal</span>
            <span className="text-muted-foreground">Proteínas: {suggestedTargets.protein} g</span>
            <span className="text-muted-foreground">Carboidratos: {suggestedTargets.carbs} g</span>
            <span className="text-muted-foreground">Gorduras: {suggestedTargets.fat} g</span>
          </div>
          <Button
            size="sm"
            onClick={onApplySuggested}
            disabled={isPending}
          >
            <Calculator className="mr-2 h-4 w-4" />
            Aplicar Metas Sugeridas
          </Button>
        </div>
      )}
      {onStartEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onStartEdit}
          disabled={isPending}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Definir Metas Manualmente
        </Button>
      )}
    </div>
  );
}
