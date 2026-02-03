"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GoalForm, createEmptyGoal } from "./goal-form";
import type { PhaseFormData, GoalFormData } from "@/types/database";

interface PhaseBuilderProps {
  phases: PhaseFormData[];
  onChange: (phases: PhaseFormData[]) => void;
}

export function PhaseBuilder({ phases, onChange }: PhaseBuilderProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
    new Set([0])
  );

  function toggleExpanded(index: number) {
    const updated = new Set(expandedPhases);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setExpandedPhases(updated);
  }

  function addPhase() {
    const newPhase = createEmptyPhase();
    const newIndex = phases.length;
    onChange([...phases, newPhase]);
    setExpandedPhases(new Set([...expandedPhases, newIndex]));
  }

  function removePhase(index: number) {
    const updated = phases.filter((_, i) => i !== index);
    onChange(updated);
    // Update expanded indices
    const newExpanded = new Set<number>();
    expandedPhases.forEach((i) => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedPhases(newExpanded);
  }

  function updatePhase(index: number, phase: PhaseFormData) {
    const updated = [...phases];
    updated[index] = phase;
    onChange(updated);
  }

  function updatePhaseField<K extends keyof PhaseFormData>(
    index: number,
    field: K,
    value: PhaseFormData[K]
  ) {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function addGoalToPhase(phaseIndex: number) {
    const updated = [...phases];
    updated[phaseIndex] = {
      ...updated[phaseIndex],
      goals: [...updated[phaseIndex].goals, createEmptyGoal()],
    };
    onChange(updated);
  }

  function updateGoalInPhase(
    phaseIndex: number,
    goalIndex: number,
    goal: GoalFormData
  ) {
    const updated = [...phases];
    const goals = [...updated[phaseIndex].goals];
    goals[goalIndex] = goal;
    updated[phaseIndex] = { ...updated[phaseIndex], goals };
    onChange(updated);
  }

  function removeGoalFromPhase(phaseIndex: number, goalIndex: number) {
    const updated = [...phases];
    const goals = updated[phaseIndex].goals.filter((_, i) => i !== goalIndex);
    updated[phaseIndex] = { ...updated[phaseIndex], goals };
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      {phases.map((phase, phaseIndex) => {
        const isExpanded = expandedPhases.has(phaseIndex);

        return (
          <div
            key={phaseIndex}
            className="rounded-2xl border bg-card overflow-hidden"
          >
            {/* Phase Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
              onClick={() => toggleExpanded(phaseIndex)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {phaseIndex + 1}
                </div>
                <div>
                  <h3 className="font-medium">
                    {phase.title || `Fase ${phaseIndex + 1}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {phase.goals.length}{" "}
                    {phase.goals.length === 1 ? "meta" : "metas"} &bull;{" "}
                    {phase.completion_threshold}% para completar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {phases.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhase(phaseIndex);
                    }}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Phase Content */}
            {isExpanded && (
              <div className="border-t p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Título da Fase */}
                  <div className="space-y-2">
                    <Label htmlFor={`phase-title-${phaseIndex}`}>
                      Título da Fase *
                    </Label>
                    <Input
                      id={`phase-title-${phaseIndex}`}
                      value={phase.title}
                      onChange={(e) =>
                        updatePhaseField(phaseIndex, "title", e.target.value)
                      }
                      placeholder="Ex: Consciência"
                    />
                  </div>

                  {/* Threshold */}
                  <div className="space-y-2">
                    <Label htmlFor={`phase-threshold-${phaseIndex}`}>
                      % para completar
                    </Label>
                    <Input
                      id={`phase-threshold-${phaseIndex}`}
                      type="number"
                      min={1}
                      max={100}
                      value={phase.completion_threshold}
                      onChange={(e) =>
                        updatePhaseField(
                          phaseIndex,
                          "completion_threshold",
                          parseInt(e.target.value) || 100
                        )
                      }
                    />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`phase-description-${phaseIndex}`}>
                      Descrição (opcional)
                    </Label>
                    <Textarea
                      id={`phase-description-${phaseIndex}`}
                      value={phase.description || ""}
                      onChange={(e) =>
                        updatePhaseField(
                          phaseIndex,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Descrição da fase..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Goals */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Metas da Fase</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addGoalToPhase(phaseIndex)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Adicionar Meta
                    </Button>
                  </div>

                  {phase.goals.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Nenhuma meta adicionada. Clique em "Adicionar Meta" para
                      começar.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {phase.goals.map((goal, goalIndex) => (
                        <GoalForm
                          key={goalIndex}
                          goal={goal}
                          index={goalIndex}
                          onChange={(i, g) =>
                            updateGoalInPhase(phaseIndex, i, g)
                          }
                          onRemove={(i) => removeGoalFromPhase(phaseIndex, i)}
                          canRemove={phase.goals.length > 1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Phase Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addPhase}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Fase
      </Button>
    </div>
  );
}

// Helper to create an empty phase
export function createEmptyPhase(): PhaseFormData {
  return {
    title: "",
    completion_threshold: 100,
    goals: [createEmptyGoal()],
  };
}
