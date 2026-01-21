"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { TimeSlotRow } from "./time-slot-row";
import type { NutriAvailability } from "@/types/database";

interface WeekScheduleProps {
  initialAvailability: NutriAvailability[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
] as const;

interface DaySlot {
  id?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isNew?: boolean;
}

type WeekScheduleState = Record<number, DaySlot[]>;

interface OverlapError {
  dayOfWeek: number;
  dayLabel: string;
  slot1: { start: string; end: string };
  slot2: { start: string; end: string };
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function checkForOverlaps(
  schedule: WeekScheduleState,
  daysOfWeek: readonly { value: number; label: string }[]
): OverlapError | null {
  for (const day of daysOfWeek) {
    const slots = schedule[day.value];
    if (slots.length < 2) continue;

    // Sort slots by start time for easier comparison
    const sortedSlots = [...slots].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];

      const currentEnd = timeToMinutes(current.endTime);
      const nextStart = timeToMinutes(next.startTime);

      // Overlap occurs if current slot ends after next slot starts
      if (currentEnd > nextStart) {
        return {
          dayOfWeek: day.value,
          dayLabel: day.label,
          slot1: { start: current.startTime, end: current.endTime },
          slot2: { start: next.startTime, end: next.endTime },
        };
      }
    }
  }

  return null;
}

function groupByDay(availability: NutriAvailability[]): WeekScheduleState {
  const grouped: WeekScheduleState = {};

  for (let i = 0; i < 7; i++) {
    grouped[i] = [];
  }

  for (const slot of availability) {
    grouped[slot.day_of_week].push({
      id: slot.id,
      startTime: slot.start_time.slice(0, 5),
      endTime: slot.end_time.slice(0, 5),
      isActive: slot.is_active,
    });
  }

  return grouped;
}

export function WeekSchedule({ initialAvailability }: WeekScheduleProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<WeekScheduleState>(() =>
    groupByDay(initialAvailability)
  );
  const [isSaving, setIsSaving] = useState(false);

  function addSlot(dayOfWeek: number) {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: [
        ...prev[dayOfWeek],
        {
          startTime: "08:00",
          endTime: "18:00",
          isActive: true,
          isNew: true,
        },
      ],
    }));
  }

  function removeSlot(dayOfWeek: number, index: number) {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((_, i) => i !== index),
    }));
  }

  function updateSlot(
    dayOfWeek: number,
    index: number,
    field: keyof DaySlot,
    value: string | boolean
  ) {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  }

  function toggleDayActive(dayOfWeek: number) {
    const daySlots = schedule[dayOfWeek];
    const allActive = daySlots.every((slot) => slot.isActive);

    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((slot) => ({
        ...slot,
        isActive: !allActive,
      })),
    }));
  }

  async function handleSave() {
    // Validate for overlapping slots before saving
    const overlapError = checkForOverlaps(schedule, DAYS_OF_WEEK);
    if (overlapError) {
      toast.error("Horários sobrepostos", {
        description: `${overlapError.dayLabel}: ${overlapError.slot1.start}-${overlapError.slot1.end} e ${overlapError.slot2.start}-${overlapError.slot2.end}`,
      });
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Collect all slots to save
      const slotsToInsert: {
        nutri_id: string;
        day_of_week: number;
        start_time: string;
        end_time: string;
        is_active: boolean;
      }[] = [];

      const slotsToUpdate: {
        id: string;
        start_time: string;
        end_time: string;
        is_active: boolean;
      }[] = [];

      const existingIds = new Set<string>();

      for (const [dayStr, slots] of Object.entries(schedule)) {
        const dayOfWeek = parseInt(dayStr);

        for (const slot of slots) {
          if (slot.id && !slot.isNew) {
            existingIds.add(slot.id);
            slotsToUpdate.push({
              id: slot.id,
              start_time: slot.startTime + ":00",
              end_time: slot.endTime + ":00",
              is_active: slot.isActive,
            });
          } else {
            slotsToInsert.push({
              nutri_id: user.id,
              day_of_week: dayOfWeek,
              start_time: slot.startTime + ":00",
              end_time: slot.endTime + ":00",
              is_active: slot.isActive,
            });
          }
        }
      }

      // Delete slots that were removed
      const originalIds = initialAvailability.map((a) => a.id);
      const idsToDelete = originalIds.filter((id) => !existingIds.has(id));

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("nutri_availability")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) throw deleteError;
      }

      // Update existing slots
      for (const slot of slotsToUpdate) {
        const { error: updateError } = await supabase
          .from("nutri_availability")
          .update({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: slot.is_active,
          })
          .eq("id", slot.id);

        if (updateError) throw updateError;
      }

      // Insert new slots
      if (slotsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("nutri_availability")
          .insert(slotsToInsert);

        if (insertError) {
          if (insertError.code === "23505") {
            throw new Error("Horário duplicado detectado");
          }
          throw insertError;
        }
      }

      toast.success("Disponibilidade salva com sucesso!");
      router.refresh();
    } catch (err) {
      console.error("Error saving availability:", err);
      toast.error("Erro ao salvar", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {DAYS_OF_WEEK.map((day) => {
          const daySlots = schedule[day.value];
          const hasSlotsActive = daySlots.some((slot) => slot.isActive);

          return (
            <div
              key={day.value}
              className="rounded-xl border bg-card p-3 sm:p-4 shadow-soft"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    id={`day-${day.value}`}
                    checked={hasSlotsActive && daySlots.length > 0}
                    onCheckedChange={() => {
                      if (daySlots.length === 0) {
                        addSlot(day.value);
                      } else {
                        toggleDayActive(day.value);
                      }
                    }}
                  />
                  <Label
                    htmlFor={`day-${day.value}`}
                    className="text-base font-medium"
                  >
                    {day.label}
                  </Label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSlot(day.value)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar horário
                </Button>
              </div>

              {daySlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário configurado para este dia
                </p>
              ) : (
                <div className="space-y-3">
                  {daySlots.map((slot, index) => (
                    <TimeSlotRow
                      key={slot.id || `new-${index}`}
                      startTime={slot.startTime}
                      endTime={slot.endTime}
                      isActive={slot.isActive}
                      onStartTimeChange={(value) =>
                        updateSlot(day.value, index, "startTime", value)
                      }
                      onEndTimeChange={(value) =>
                        updateSlot(day.value, index, "endTime", value)
                      }
                      onToggleActive={(value) =>
                        updateSlot(day.value, index, "isActive", value)
                      }
                      onRemove={() => removeSlot(day.value, index)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
