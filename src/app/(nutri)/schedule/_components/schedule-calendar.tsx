"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import type { NutriTimeBlock } from "@/types/database";

interface ScheduleCalendarProps {
  selectedDate: Date;
  appointmentDates: Date[];
  blockedDates?: Date[];
}

// Format date to YYYY-MM-DD using local timezone (not UTC)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ScheduleCalendar({
  selectedDate,
  appointmentDates,
  blockedDates = [],
}: ScheduleCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatLocalDate(date));
    router.push(`/schedule?${params.toString()}`);
  }

  // Create modifiers for days with appointments
  const daysWithAppointments = appointmentDates.map((date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  // Create modifiers for blocked days
  const daysBlocked = blockedDates.map((date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  return (
    <div className="space-y-3">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        modifiers={{
          hasAppointment: daysWithAppointments,
          blocked: daysBlocked,
        }}
        modifiersStyles={{
          hasAppointment: {
            fontWeight: "bold",
            textDecoration: "underline",
            textDecorationColor: "var(--primary)",
          },
          blocked: {
            backgroundColor: "hsl(var(--destructive) / 0.1)",
            color: "hsl(var(--destructive))",
          },
        }}
        className="rounded-md border"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold underline">15</span>
          <span>Com consultas</span>
        </div>
        {blockedDates.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-destructive/10 text-center leading-4 text-destructive text-[10px]">
              15
            </span>
            <span>Bloqueado</span>
          </div>
        )}
      </div>
    </div>
  );
}
