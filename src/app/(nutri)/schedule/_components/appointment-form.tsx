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
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Patient, NutriAvailability, NutriTimeBlock, Appointment } from "@/types/database";
import { TimeSlotPicker } from "./time-slot-picker";

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
  const [validationError, setValidationError] = useState<string | null>(null);

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
      : ""
  );
  const [duration, setDuration] = useState(
    initialData?.duration_minutes?.toString() || "60"
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  const isEditing = !!appointmentId;

  async function validateSlot(): Promise<boolean> {
    if (!date || !time) return false;

    setValidationError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setValidationError("Usuário não autenticado");
        return false;
      }

      const [hours, minutes] = time.split(":").map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + parseInt(duration) * 60 * 1000);

      // Check if in the past
      if (slotStart < new Date()) {
        setValidationError("Não é possível agendar no passado");
        return false;
      }

      // Check availability
      const dayOfWeek = date.getDay();
      const startTimeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
      const endTimeStr = `${slotEnd.getHours().toString().padStart(2, "0")}:${slotEnd.getMinutes().toString().padStart(2, "0")}:00`;

      const { data: availabilityData } = await supabase
        .from("nutri_availability")
        .select("*")
        .eq("nutri_id", user.id)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true);

      const availability = (availabilityData ?? []) as NutriAvailability[];

      if (availability.length === 0) {
        setValidationError("Você não atende neste dia da semana");
        return false;
      }

      const isWithinAvailability = availability.some((avail) => {
        return startTimeStr >= avail.start_time && endTimeStr <= avail.end_time;
      });

      if (!isWithinAvailability) {
        setValidationError("Horário fora da sua disponibilidade configurada");
        return false;
      }

      // Check for time blocks
      const { data: blocksData } = await supabase
        .from("nutri_time_blocks")
        .select("*")
        .eq("nutri_id", user.id)
        .lte("start_datetime", slotEnd.toISOString())
        .gte("end_datetime", slotStart.toISOString());

      const blocks = (blocksData ?? []) as NutriTimeBlock[];

      if (blocks.length > 0) {
        setValidationError(`Horário bloqueado: ${blocks[0].title}`);
        return false;
      }

      // Check for existing appointments
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      let appointmentQuery = supabase
        .from("appointments")
        .select("*")
        .eq("nutri_id", user.id)
        .neq("status", "cancelled")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      if (appointmentId) {
        appointmentQuery = appointmentQuery.neq("id", appointmentId);
      }

      const { data: appointmentsData } = await appointmentQuery;
      const appointments = (appointmentsData ?? []) as Appointment[];

      for (const appointment of appointments) {
        const appointmentStart = new Date(appointment.scheduled_at);
        const appointmentEnd = new Date(
          appointmentStart.getTime() + appointment.duration_minutes * 60 * 1000
        );

        if (slotStart < appointmentEnd && slotEnd > appointmentStart) {
          setValidationError("Já existe uma consulta neste horário");
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error("Validation error:", err);
      setValidationError("Erro ao validar horário");
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setValidationError(null);

    if (!patientId) {
      setError("Selecione um paciente.");
      return;
    }

    if (!date) {
      setError("Selecione uma data.");
      return;
    }

    if (!time) {
      setError("Selecione um horário.");
      return;
    }

    // Validate the slot before submitting
    const isValid = await validateSlot();
    if (!isValid) {
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

      {validationError && (
        <div className="rounded-md bg-yellow-500/10 border border-yellow-500/50 p-3 text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{validationError}</span>
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
                onSelect={(newDate) => {
                  setDate(newDate);
                  setTime(""); // Reset time when date changes
                  setValidationError(null);
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duração *</Label>
          <Select
            value={duration}
            onValueChange={(value) => {
              setDuration(value);
              setValidationError(null);
            }}
          >
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
      </div>

      <TimeSlotPicker
        date={date}
        duration={parseInt(duration)}
        selectedTime={time}
        onTimeSelect={(newTime) => {
          setTime(newTime);
          setValidationError(null);
        }}
        excludeAppointmentId={appointmentId}
      />

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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || patients.length === 0 || !time}
          className="w-full sm:w-auto"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar Alterações" : "Agendar Consulta"}
        </Button>
      </div>
    </form>
  );
}
