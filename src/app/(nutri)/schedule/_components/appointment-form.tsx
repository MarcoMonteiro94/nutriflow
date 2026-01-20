"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/database";

interface AppointmentFormProps {
  patients: Patient[];
  defaultPatientId?: string;
  defaultDate?: string;
  appointmentId?: string;
  initialData?: {
    patient_id: string;
    scheduled_at: string;
    duration_minutes: number;
    notes: string | null;
  };
}

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutos" },
  { value: "45", label: "45 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1 hora e 30 min" },
  { value: "120", label: "2 horas" },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, hour) =>
  Array.from({ length: 2 }, (_, halfHour) => {
    const h = hour.toString().padStart(2, "0");
    const m = (halfHour * 30).toString().padStart(2, "0");
    return `${h}:${m}`;
  })
).flat();

export function AppointmentForm({
  patients,
  defaultPatientId,
  defaultDate,
  appointmentId,
  initialData,
}: AppointmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultDateObj = defaultDate ? new Date(defaultDate) : new Date();
  const initialDateObj = initialData
    ? new Date(initialData.scheduled_at)
    : defaultDateObj;

  const [patientId, setPatientId] = useState(
    initialData?.patient_id || defaultPatientId || ""
  );
  const [date, setDate] = useState<Date | undefined>(initialDateObj);
  const [time, setTime] = useState(
    initialData
      ? format(new Date(initialData.scheduled_at), "HH:mm")
      : "09:00"
  );
  const [duration, setDuration] = useState(
    initialData?.duration_minutes?.toString() || "60"
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  const isEditing = !!appointmentId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!patientId) {
      setError("Selecione um paciente.");
      return;
    }

    if (!date) {
      setError("Selecione uma data.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Você precisa estar logado para agendar consultas.");
        setIsSubmitting(false);
        return;
      }

      // Combine date and time
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const appointmentData = {
        patient_id: patientId,
        nutri_id: user.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(duration),
        notes: notes || null,
        status: "scheduled" as const,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", appointmentId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("appointments")
          .insert(appointmentData);

        if (insertError) {
          throw insertError;
        }
      }

      // Navigate back to schedule with the selected date
      const dateParam = format(scheduledAt, "yyyy-MM-dd");
      router.push(`/schedule?date=${dateParam}`);
      router.refresh();
    } catch (err) {
      console.error("Error saving appointment:", err);
      setError("Erro ao salvar agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="patient">Paciente *</Label>
        <Select value={patientId} onValueChange={setPatientId}>
          <SelectTrigger id="patient">
            <SelectValue placeholder="Selecione um paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {patients.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum paciente cadastrado.{" "}
            <Link href="/patients/new" className="text-primary hover:underline">
              Cadastre um paciente
            </Link>{" "}
            primeiro.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Data *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Horário *</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger id="time">
              <SelectValue placeholder="Selecione um horário" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duração *</Label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger id="duration">
            <SelectValue placeholder="Selecione a duração" />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações sobre a consulta (opcional)"
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || patients.length === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar Alterações" : "Agendar Consulta"}
        </Button>
      </div>
    </form>
  );
}
