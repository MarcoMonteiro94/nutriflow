"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { NutriAvailability, NutriTimeBlock, Appointment } from "@/types/database";

interface BookingFormProps {
  nutriId: string;
  organizationId: string;
  availableDates: Date[];
}

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutos" },
  { value: "45", label: "45 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1 hora e 30 min" },
  { value: "120", label: "2 horas" },
];

interface AvailableSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export function BookingForm({ nutriId, organizationId, availableDates }: BookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Time slots state
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    if (date) {
      loadAvailableSlots();
    } else {
      setSlots([]);
      setTime("");
    }
  }, [date, duration]);

  async function loadAvailableSlots() {
    if (!date) return;

    setLoadingSlots(true);
    setSlotsError(null);
    setTime("");

    try {
      const supabase = createClient();
      const dayOfWeek = date.getDay();

      // Get availability for this day
      const { data: availabilityData } = await supabase
        .from("nutri_availability")
        .select("*")
        .eq("nutri_id", nutriId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .order("start_time", { ascending: true });

      const availability = (availabilityData ?? []) as NutriAvailability[];

      if (availability.length === 0) {
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
        .eq("nutri_id", nutriId)
        .lte("start_datetime", endOfDay.toISOString())
        .gte("end_datetime", startOfDay.toISOString());

      const blocks = (blocksData ?? []) as NutriTimeBlock[];

      // Get existing appointments for this date
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("nutri_id", nutriId)
        .neq("status", "cancelled")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      const appointments = (appointmentsData ?? []) as Appointment[];

      // Generate slots based on availability
      const generatedSlots: AvailableSlot[] = [];
      const intervalMinutes = 30;
      const durationNum = parseInt(duration);

      for (const avail of availability) {
        const [startHours, startMinutes] = avail.start_time.split(":").map(Number);
        const [endHours, endMinutes] = avail.end_time.split(":").map(Number);

        const availStart = new Date(date);
        availStart.setHours(startHours, startMinutes, 0, 0);

        const availEnd = new Date(date);
        availEnd.setHours(endHours, endMinutes, 0, 0);

        let currentTime = new Date(availStart);

        while (currentTime.getTime() + durationNum * 60 * 1000 <= availEnd.getTime()) {
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime.getTime() + durationNum * 60 * 1000);

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
      setSlotsError("Erro ao carregar horários disponíveis");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!date || !time) {
      setError("Por favor, selecione uma data e horário");
      return;
    }

    if (!fullName || !email) {
      setError("Nome e email são obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const response = await fetch("/api/booking/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nutriId,
          organizationId,
          patientData: {
            full_name: fullName,
            email,
            phone: phone || undefined,
            notes: notes || undefined,
          },
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: parseInt(duration),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar agendamento");
        return;
      }

      setSuccess(true);

      // Reset form
      setDate(undefined);
      setTime("");
      setFullName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setSlots([]);
    } catch (err) {
      setError("Erro ao processar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400 flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Agendamento realizado com sucesso!</p>
            <p className="text-xs mt-1 opacity-90">
              Você receberá um email de confirmação em breve.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Duration Selection */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duração da Consulta *</Label>
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

        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Data da Consulta *</Label>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => {
              const isDisabled = !availableDates.some(
                (availDate) =>
                  availDate.getDate() === date.getDate() &&
                  availDate.getMonth() === date.getMonth() &&
                  availDate.getFullYear() === date.getFullYear()
              );
              return isDisabled;
            }}
            locale={ptBR}
            className="rounded-xl border w-full"
          />
          {date && (
            <p className="text-sm text-muted-foreground">
              Data selecionada: {format(date, "PPP", { locale: ptBR })}
            </p>
          )}
        </div>

        {/* Time Slot Selection */}
        {date && (
          <div className="space-y-2">
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : slotsError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
                <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                {slotsError}
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                Nenhum horário disponível para esta data
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label>Horário da Consulta *</Label>
                  <span className="text-xs text-muted-foreground">
                    {availableCount} de {slots.length} horários disponíveis
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((slot) => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={time === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setTime(slot.time)}
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
              </>
            )}
          </div>
        )}
      </div>

      {/* Patient Information */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="font-medium text-lg">Seus Dados</h3>

        <div className="space-y-2">
          <Label htmlFor="fullName">Nome Completo *</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Digite seu nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Alguma informação adicional que gostaria de compartilhar?"
            className="resize-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !date || !time || !fullName || !email}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Agendando...
            </>
          ) : (
            "Confirmar Agendamento"
          )}
        </Button>
      </div>
    </form>
  );
}
