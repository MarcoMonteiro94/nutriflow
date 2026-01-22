"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ConsolidatedCalendarProps {
  selectedDate: Date;
  appointmentDates: Date[];
  nutris: { id: string; name: string }[];
  selectedNutri: string;
}

// Format date to YYYY-MM-DD using local timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ConsolidatedCalendar({
  selectedDate,
  appointmentDates,
  nutris,
  selectedNutri,
}: ConsolidatedCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatLocalDate(date));
    router.push(`/organization/schedule?${params.toString()}`);
  }

  function handleNutriChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("nutri");
    } else {
      params.set("nutri", value);
    }
    router.push(`/organization/schedule?${params.toString()}`);
  }

  // Create a set of date strings for quick lookup
  const appointmentDateSet = new Set(
    appointmentDates.map((d) => formatLocalDate(d))
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Filtrar por Nutricionista</Label>
        <Select value={selectedNutri || "all"} onValueChange={handleNutriChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os nutricionistas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os nutricionistas</SelectItem>
            {nutris.map((nutri) => (
              <SelectItem key={nutri.id} value={nutri.id}>
                {nutri.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        className="rounded-md border"
        modifiers={{
          hasAppointment: (date) =>
            appointmentDateSet.has(formatLocalDate(date)),
        }}
        modifiersStyles={{
          hasAppointment: {
            backgroundColor: "hsl(var(--primary) / 0.1)",
            borderRadius: "50%",
          },
        }}
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-primary/20" />
          <span>Dia com atendimento</span>
        </div>
      </div>
    </div>
  );
}
