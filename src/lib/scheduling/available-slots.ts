import { createClient } from "@/lib/supabase/server";
import type { NutriAvailability } from "@/types/database";
import { getConflictsForDate, type TimeSlot } from "./conflict-checker";

export interface AvailableSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface GetAvailableSlotsOptions {
  nutriId: string;
  date: Date;
  durationMinutes?: number;
  intervalMinutes?: number;
}

export async function getAvailableSlotsForDate({
  nutriId,
  date,
  durationMinutes = 60,
  intervalMinutes = 30,
}: GetAvailableSlotsOptions): Promise<AvailableSlot[]> {
  const supabase = await createClient();
  const dayOfWeek = date.getDay();

  // Get availability for this day of week
  const { data } = await supabase
    .from("nutri_availability")
    .select("*")
    .eq("nutri_id", nutriId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .order("start_time", { ascending: true });

  const availabilitySlots = (data ?? []) as NutriAvailability[];

  if (availabilitySlots.length === 0) {
    return [];
  }

  // Get conflicts for this date
  const { blocks, appointments } = await getConflictsForDate(nutriId, date);

  const slots: AvailableSlot[] = [];

  for (const availability of availabilitySlots) {
    const slotsFromAvailability = generateSlotsFromAvailability(
      date,
      availability,
      durationMinutes,
      intervalMinutes
    );

    for (const slot of slotsFromAvailability) {
      const isBlocked = blocks.some((block) => {
        const blockStart = new Date(block.start_datetime);
        const blockEnd = new Date(block.end_datetime);
        return slot.start < blockEnd && slot.end > blockStart;
      });

      const hasAppointment = appointments.some((appointment) => {
        const appointmentStart = new Date(appointment.scheduled_at);
        const appointmentEnd = new Date(
          appointmentStart.getTime() + appointment.duration_minutes * 60 * 1000
        );
        return slot.start < appointmentEnd && slot.end > appointmentStart;
      });

      const isPast = slot.start < new Date();

      slots.push({
        ...slot,
        available: !isBlocked && !hasAppointment && !isPast,
      });
    }
  }

  return slots;
}

function generateSlotsFromAvailability(
  date: Date,
  availability: NutriAvailability,
  durationMinutes: number,
  intervalMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const [startHours, startMinutes] = availability.start_time
    .split(":")
    .map(Number);
  const [endHours, endMinutes] = availability.end_time.split(":").map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(startHours, startMinutes, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endHours, endMinutes, 0, 0);

  let currentStart = new Date(dayStart);

  while (currentStart.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
    const slotEnd = new Date(
      currentStart.getTime() + durationMinutes * 60 * 1000
    );

    slots.push({
      start: new Date(currentStart),
      end: slotEnd,
    });

    currentStart = new Date(
      currentStart.getTime() + intervalMinutes * 60 * 1000
    );
  }

  return slots;
}

export async function getAvailableSlotsForDateRange(
  nutriId: string,
  startDate: Date,
  endDate: Date,
  durationMinutes = 60
): Promise<Map<string, AvailableSlot[]>> {
  const slotsMap = new Map<string, AvailableSlot[]>();
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split("T")[0];
    const slots = await getAvailableSlotsForDate({
      nutriId,
      date: new Date(currentDate),
      durationMinutes,
    });
    slotsMap.set(dateKey, slots);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slotsMap;
}

export async function hasAvailableSlotsOnDate(
  nutriId: string,
  date: Date,
  durationMinutes = 60
): Promise<boolean> {
  const slots = await getAvailableSlotsForDate({
    nutriId,
    date,
    durationMinutes,
  });
  return slots.some((slot) => slot.available);
}

export async function getNextAvailableSlot(
  nutriId: string,
  fromDate: Date = new Date(),
  durationMinutes = 60,
  maxDaysAhead = 30
): Promise<AvailableSlot | null> {
  const currentDate = new Date(fromDate);

  for (let i = 0; i < maxDaysAhead; i++) {
    const slots = await getAvailableSlotsForDate({
      nutriId,
      date: currentDate,
      durationMinutes,
    });

    const availableSlot = slots.find((slot) => slot.available);
    if (availableSlot) {
      return availableSlot;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return null;
}

export function formatSlotTime(slot: AvailableSlot): string {
  return slot.start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSlotRange(slot: AvailableSlot): string {
  const start = slot.start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = slot.end.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${start} - ${end}`;
}
