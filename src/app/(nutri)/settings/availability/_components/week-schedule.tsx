"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TimeSlotRow } from "./time-slot-row";
import type { NutriAvailability } from "@/types/database";

interface WeekScheduleProps {
  initialAvailability: NutriAvailability[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
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

function formatDuration(startTime: string, endTime: string): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function checkForOverlaps(
  schedule: WeekScheduleState,
  daysOfWeek: readonly { value: number; label: string; short: string }[]
): OverlapError | null {
  for (const day of daysOfWeek) {
    const slots = schedule[day.value];
    if (slots.length < 2) continue;

    const sortedSlots = [...slots].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];

      const currentEnd = timeToMinutes(current.endTime);
      const nextStart = timeToMinutes(next.startTime);

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
      isActive: slot.is_active ?? true,
    });
  }

  return grouped;
}

function getTotalHours(schedule: WeekScheduleState): string {
  let totalMinutes = 0;

  for (const slots of Object.values(schedule)) {
    for (const slot of slots) {
      if (slot.isActive) {
        totalMinutes += timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
      }
    }
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export function WeekSchedule({ initialAvailability }: WeekScheduleProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<WeekScheduleState>(() =>
    groupByDay(initialAvailability)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const totalHours = getTotalHours(schedule);
  const activeDays = Object.entries(schedule).filter(
    ([, slots]) => slots.length > 0 && slots.some((s) => s.isActive)
  ).length;

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
    setExpandedDay(dayOfWeek);
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

      const originalIds = initialAvailability.map((a) => a.id);
      const idsToDelete = originalIds.filter((id) => !existingIds.has(id));

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("nutri_availability")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) throw deleteError;
      }

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
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{totalHours}</p>
              <p className="text-xs text-muted-foreground">Horas semanais</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{activeDays}</p>
              <p className="text-xs text-muted-foreground">Dias ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Days Grid */}
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day, index) => {
          const daySlots = schedule[day.value];
          const hasSlotsActive = daySlots.some((slot) => slot.isActive);
          const isExpanded = expandedDay === day.value || daySlots.length > 0;
          const dayTotalMinutes = daySlots
            .filter((s) => s.isActive)
            .reduce((acc, s) => acc + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)), 0);

          return (
            <motion.div
              key={day.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={`group rounded-2xl border bg-card shadow-soft transition-all duration-200 ${
                hasSlotsActive
                  ? "border-primary/20 ring-1 ring-primary/10"
                  : "hover:border-muted-foreground/20"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-3">
                    <div
                      className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-xl font-medium text-sm transition-colors ${
                        hasSlotsActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {day.short}
                    </div>
                    <div>
                      <label
                        htmlFor={`day-${day.value}`}
                        className="text-base font-medium cursor-pointer"
                      >
                        {day.label}
                      </label>
                      {daySlots.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {daySlots.length} {daySlots.length === 1 ? "horário" : "horários"}
                          {dayTotalMinutes > 0 && (
                            <span className="ml-1.5 text-primary">
                              • {formatDuration("00:00", `${Math.floor(dayTotalMinutes / 60).toString().padStart(2, "0")}:${(dayTotalMinutes % 60).toString().padStart(2, "0")}`)}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSlot(day.value)}
                  className="rounded-full h-9 px-3 gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </div>

              {/* Time Slots */}
              <AnimatePresence>
                {daySlots.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t bg-muted/30 p-4 space-y-3">
                      {daySlots.map((slot, slotIndex) => (
                        <motion.div
                          key={slot.id || `new-${slotIndex}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: slotIndex * 0.05 }}
                        >
                          <TimeSlotRow
                            startTime={slot.startTime}
                            endTime={slot.endTime}
                            isActive={slot.isActive}
                            duration={formatDuration(slot.startTime, slot.endTime)}
                            onStartTimeChange={(value) =>
                              updateSlot(day.value, slotIndex, "startTime", value)
                            }
                            onEndTimeChange={(value) =>
                              updateSlot(day.value, slotIndex, "endTime", value)
                            }
                            onToggleActive={(value) =>
                              updateSlot(day.value, slotIndex, "isActive", value)
                            }
                            onRemove={() => removeSlot(day.value, slotIndex)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          As alterações só serão aplicadas após salvar.
        </p>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="w-full sm:w-auto rounded-full px-8"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configuração"
          )}
        </Button>
      </div>
    </div>
  );
}
