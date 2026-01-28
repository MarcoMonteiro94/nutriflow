"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NutriAvailability, NutriTimeBlock, Appointment } from "@/types/database";

interface TimeSlotPickerProps {
  date: Date | undefined;
  duration: number;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  excludeAppointmentId?: string;
  /** Optional nutri ID to check availability for (used by receptionists) */
  nutriId?: string;
}

interface AvailableSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export function TimeSlotPicker({
  date,
  duration,
  selectedTime,
  onTimeSelect,
  excludeAppointmentId,
  nutriId,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAvailability, setNoAvailability] = useState(false);

  useEffect(() => {
    if (date) {
      loadAvailableSlots();
    } else {
      setSlots([]);
      setNoAvailability(false);
    }
  }, [date, duration, excludeAppointmentId, nutriId]);

  async function loadAvailableSlots() {
    if (!date) return;

    // If nutriId is provided but empty (receptionist hasn't selected yet), don't load
    if (nutriId === "") {
      setSlots([]);
      setNoAvailability(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNoAvailability(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Usuário não autenticado");
        return;
      }

      // Use provided nutriId if available, otherwise use logged-in user's ID
      const targetNutriId = nutriId || user.id;

      const dayOfWeek = date.getDay();

      // Get availability for this day
      const { data: availabilityData } = await supabase
        .from("nutri_availability")
        .select("*")
        .eq("nutri_id", targetNutriId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .order("start_time", { ascending: true });

      const availability = (availabilityData ?? []) as NutriAvailability[];

      if (availability.length === 0) {
        setNoAvailability(true);
        setSlots([]);
        return;
      }

      // Get time blocks for this date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: blocksData } = await supabase
        .from("nutri_time_blocks")
        .select("*")
        .eq("nutri_id", targetNutriId)
        .lte("start_datetime", endOfDay.toISOString())
        .gte("end_datetime", startOfDay.toISOString());

      const blocks = (blocksData ?? []) as NutriTimeBlock[];

      // Get existing appointments for this date
      let appointmentQuery = supabase
        .from("appointments")
        .select("*")
        .eq("nutri_id", targetNutriId)
        .neq("status", "cancelled")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      if (excludeAppointmentId) {
        appointmentQuery = appointmentQuery.neq("id", excludeAppointmentId);
      }

      const { data: appointmentsData } = await appointmentQuery;
      const appointments = (appointmentsData ?? []) as Appointment[];

      // Generate slots based on availability
      const generatedSlots: AvailableSlot[] = [];
      const intervalMinutes = 30;

      for (const avail of availability) {
        const [startHours, startMinutes] = avail.start_time.split(":").map(Number);
        const [endHours, endMinutes] = avail.end_time.split(":").map(Number);

        const availStart = new Date(date);
        availStart.setHours(startHours, startMinutes, 0, 0);

        const availEnd = new Date(date);
        availEnd.setHours(endHours, endMinutes, 0, 0);

        let currentTime = new Date(availStart);

        while (currentTime.getTime() + duration * 60 * 1000 <= availEnd.getTime()) {
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);

          const timeString = `${slotStart.getHours().toString().padStart(2, "0")}:${slotStart.getMinutes().toString().padStart(2, "0")}`;

          // Check if slot is in the past
          const isPast = slotStart < new Date();

          // Check if blocked
          const blockingBlock = blocks.find((block) => {
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            return slotStart < blockEnd && slotEnd > blockStart;
          });

          // Check if has appointment
          const conflictingAppointment = appointments.find((appointment) => {
            const appointmentStart = new Date(appointment.scheduled_at);
            const appointmentEnd = new Date(
              appointmentStart.getTime() + appointment.duration_minutes * 60 * 1000
            );
            return slotStart < appointmentEnd && slotEnd > appointmentStart;
          });

          let available = true;
          let reason: string | undefined;

          if (isPast) {
            available = false;
            reason = "Horário passado";
          } else if (blockingBlock) {
            available = false;
            reason = blockingBlock.title;
          } else if (conflictingAppointment) {
            available = false;
            reason = "Ocupado";
          }

          generatedSlots.push({
            time: timeString,
            available,
            reason,
          });

          currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
        }
      }

      setSlots(generatedSlots);
    } catch (err) {
      console.error("Error loading slots:", err);
      setError("Erro ao carregar horários disponíveis");
    } finally {
      setLoading(false);
    }
  }

  // If receptionist hasn't selected a nutri yet
  if (nutriId === "") {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
        Selecione um nutricionista para ver os horários disponíveis
      </div>
    );
  }

  if (!date) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
        Selecione uma data para ver os horários disponíveis
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
        <AlertCircle className="mx-auto h-6 w-6 mb-2" />
        {error}
      </div>
    );
  }

  if (noAvailability) {
    return (
      <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-center text-sm text-yellow-700 dark:text-yellow-400">
        <AlertCircle className="mx-auto h-6 w-6 mb-2" />
        {nutriId ? (
          <>O nutricionista selecionado não configurou disponibilidade para este dia da semana.</>
        ) : (
          <>
            Você não configurou disponibilidade para este dia da semana.
            <br />
            <a href="/settings/availability" className="underline hover:no-underline mt-1 inline-block">
              Configurar disponibilidade
            </a>
          </>
        )}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Nenhum horário disponível para esta data
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Horário disponível *</Label>
        <span className="text-xs text-muted-foreground">
          {availableCount} de {slots.length} horários disponíveis
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {slots.map((slot) => (
          <Button
            key={slot.time}
            type="button"
            variant={selectedTime === slot.time ? "default" : "outline"}
            size="sm"
            disabled={!slot.available}
            onClick={() => onTimeSelect(slot.time)}
            className={cn(
              "text-sm",
              !slot.available && "opacity-50 cursor-not-allowed line-through"
            )}
            title={!slot.available ? slot.reason : undefined}
          >
            {slot.time}
          </Button>
        ))}
      </div>

      {slots.some((s) => !s.available) && (
        <p className="text-xs text-muted-foreground">
          Horários riscados estão indisponíveis (bloqueados ou ocupados)
        </p>
      )}
    </div>
  );
}
