"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";

interface ScheduleCalendarProps {
  selectedDate: Date;
  appointmentDates: Date[];
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

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleDateSelect}
      modifiers={{
        hasAppointment: daysWithAppointments,
      }}
      modifiersStyles={{
        hasAppointment: {
          fontWeight: "bold",
          textDecoration: "underline",
          textDecorationColor: "var(--primary)",
        },
      }}
      className="rounded-md border"
    />
  );
}
