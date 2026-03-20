"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { formatDateStr, parseDateStr, computeBlockedDateStrings, extractDateStrings } from "@/lib/date-utils";
import type { NutriTimeBlock } from "@/types/database";

interface ScheduleCalendarProps {
  selectedDateStr: string;
  appointmentDateIsos: string[];
  calendarTimeBlocks?: NutriTimeBlock[];
}

export function ScheduleCalendar({
  selectedDateStr,
  appointmentDateIsos,
  calendarTimeBlocks = [],
}: ScheduleCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse date locally on client for correct timezone
  const selectedDate = parseDateStr(selectedDateStr);

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatDateStr(date));
    router.push(`/schedule?${params.toString()}`);
  }

  // Compute dates on client for correct timezone interpretation
  const daysWithAppointments = extractDateStrings(appointmentDateIsos).map((str) => parseDateStr(str));
  const blockedDateStrs = computeBlockedDateStrings(calendarTimeBlocks);
  const daysBlocked = blockedDateStrs.map((str) => parseDateStr(str));

  return (
    <div className="flex flex-col items-center space-y-3">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        modifiers={{
          hasAppointment: daysWithAppointments,
          blocked: daysBlocked,
        }}
        modifiersClassNames={{
          hasAppointment: "font-bold underline decoration-primary",
          blocked: "bg-destructive/10 text-destructive aria-selected:ring-2 aria-selected:ring-primary aria-selected:ring-offset-1",
        }}
        className="rounded-md border"
      />

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold underline">15</span>
          <span>Com consultas</span>
        </div>
        {blockedDateStrs.length > 0 && (
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
