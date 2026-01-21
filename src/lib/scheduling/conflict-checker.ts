import { createClient } from "@/lib/supabase/server";
import type { Appointment, NutriTimeBlock, NutriAvailability } from "@/types/database";

export interface TimeSlot {
  start: Date;
  end: Date;
}

export type ConflictReason =
  | "outside_availability"
  | "blocked"
  | "appointment_exists"
  | "past_time";

export interface ConflictResult {
  hasConflict: boolean;
  reason?: ConflictReason;
  message?: string;
  conflictingAppointment?: Appointment;
  conflictingBlock?: NutriTimeBlock;
}

export async function checkTimeSlotAvailability(
  nutriId: string,
  slot: TimeSlot,
  excludeAppointmentId?: string
): Promise<ConflictResult> {
  const supabase = await createClient();

  // 1. Check if slot is in the past
  if (slot.start < new Date()) {
    return {
      hasConflict: true,
      reason: "past_time",
      message: "Não é possível agendar no passado",
    };
  }

  // 2. Check if within weekly availability
  const dayOfWeek = slot.start.getDay();
  const startTime = formatTimeForComparison(slot.start);
  const endTime = formatTimeForComparison(slot.end);

  const { data: availabilityData } = await supabase
    .from("nutri_availability")
    .select("*")
    .eq("nutri_id", nutriId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  const availabilitySlots = (availabilityData ?? []) as NutriAvailability[];

  if (availabilitySlots.length === 0) {
    return {
      hasConflict: true,
      reason: "outside_availability",
      message: "Nutricionista não atende neste dia",
    };
  }

  const isWithinAvailability = availabilitySlots.some((availability) => {
    return (
      startTime >= availability.start_time && endTime <= availability.end_time
    );
  });

  if (!isWithinAvailability) {
    return {
      hasConflict: true,
      reason: "outside_availability",
      message: "Horário fora da disponibilidade do nutricionista",
    };
  }

  // 3. Check for time blocks
  const { data: blocksData } = await supabase
    .from("nutri_time_blocks")
    .select("*")
    .eq("nutri_id", nutriId)
    .lte("start_datetime", slot.end.toISOString())
    .gte("end_datetime", slot.start.toISOString());

  const timeBlocks = (blocksData ?? []) as NutriTimeBlock[];

  if (timeBlocks.length > 0) {
    return {
      hasConflict: true,
      reason: "blocked",
      message: `Horário bloqueado: ${timeBlocks[0].title}`,
      conflictingBlock: timeBlocks[0],
    };
  }

  // 4. Check for existing appointments
  let appointmentQuery = supabase
    .from("appointments")
    .select("*")
    .eq("nutri_id", nutriId)
    .neq("status", "cancelled");

  if (excludeAppointmentId) {
    appointmentQuery = appointmentQuery.neq("id", excludeAppointmentId);
  }

  const { data: appointmentsData } = await appointmentQuery;
  const appointments = (appointmentsData ?? []) as Appointment[];

  for (const appointment of appointments) {
      const appointmentStart = new Date(appointment.scheduled_at);
      const appointmentEnd = new Date(
        appointmentStart.getTime() + appointment.duration_minutes * 60 * 1000
      );

      if (
        (slot.start >= appointmentStart && slot.start < appointmentEnd) ||
        (slot.end > appointmentStart && slot.end <= appointmentEnd) ||
        (slot.start <= appointmentStart && slot.end >= appointmentEnd)
      ) {
        return {
          hasConflict: true,
          reason: "appointment_exists",
          message: "Já existe uma consulta neste horário",
          conflictingAppointment: appointment,
        };
      }
    }

  return { hasConflict: false };
}

export async function getConflictsForDate(
  nutriId: string,
  date: Date
): Promise<{
  blocks: NutriTimeBlock[];
  appointments: Appointment[];
}> {
  const supabase = await createClient();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [blocksResult, appointmentsResult] = await Promise.all([
    supabase
      .from("nutri_time_blocks")
      .select("*")
      .eq("nutri_id", nutriId)
      .lte("start_datetime", endOfDay.toISOString())
      .gte("end_datetime", startOfDay.toISOString()),
    supabase
      .from("appointments")
      .select("*")
      .eq("nutri_id", nutriId)
      .neq("status", "cancelled")
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString()),
  ]);

  return {
    blocks: (blocksResult.data ?? []) as NutriTimeBlock[],
    appointments: (appointmentsResult.data ?? []) as Appointment[],
  };
}

function formatTimeForComparison(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

export function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.start < slot2.end && slot1.end > slot2.start;
}

export function isSlotFullyContained(
  innerSlot: TimeSlot,
  outerSlot: TimeSlot
): boolean {
  return innerSlot.start >= outerSlot.start && innerSlot.end <= outerSlot.end;
}
