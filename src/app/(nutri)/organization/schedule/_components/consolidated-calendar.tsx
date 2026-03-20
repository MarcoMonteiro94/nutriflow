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
import { formatDateStr, parseDateStr, extractDateStrings } from "@/lib/date-utils";

interface ConsolidatedCalendarProps {
  selectedDateStr: string;
  appointmentDateIsos: string[];
  nutris: { id: string; name: string }[];
  selectedNutri: string;
}

export function ConsolidatedCalendar({
  selectedDateStr,
  appointmentDateIsos,
  nutris,
  selectedNutri,
}: ConsolidatedCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse date locally on client for correct timezone
  const selectedDate = parseDateStr(selectedDateStr);

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatDateStr(date));
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

  // Compute dates on client for correct timezone interpretation
  const appointmentDateSet = new Set(extractDateStrings(appointmentDateIsos));

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
            appointmentDateSet.has(formatDateStr(date)),
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
