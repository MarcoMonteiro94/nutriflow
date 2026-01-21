import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { ScheduleCalendar } from "./_components/schedule-calendar";
import { AppointmentsList } from "./_components/appointments-list";
import type { Appointment } from "@/types/database";

interface SearchParams {
  date?: string;
}

// Format date to YYYY-MM-DD using local timezone (not UTC)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD string to Date at local midnight
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type AppointmentWithPatient = Appointment & {
  patients: {
    id: string;
    full_name: string;
  } | null;
};

async function getAppointments(selectedDate?: string): Promise<AppointmentWithPatient[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients (
        id,
        full_name
      )
    `)
    .eq("nutri_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (selectedDate) {
    // Parse date string to local Date object
    const [year, month, day] = selectedDate.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    query = query
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString());
  }

  const { data } = await query;

  return (data ?? []) as AppointmentWithPatient[];
}

async function getAppointmentDates(): Promise<Date[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("appointments")
    .select("scheduled_at")
    .eq("nutri_id", user.id);

  if (!data) return [];

  return data.map((a) => new Date(a.scheduled_at));
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedDate = params.date || formatLocalDate(new Date());

  const appointments = await getAppointments(selectedDate);
  const appointmentDates = await getAppointmentDates();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus atendimentos e consultas.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/schedule/new">
            <Plus className="mr-2 h-4 w-4" />
            Agendar Consulta
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
            <CardDescription>
              Clique em uma data para ver os atendimentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleCalendar
              selectedDate={parseLocalDate(selectedDate)}
              appointmentDates={appointmentDates}
            />
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Atendimentos do dia{" "}
              {parseLocalDate(selectedDate).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
            <CardDescription>
              {appointments.length === 0
                ? "Nenhum atendimento agendado para este dia"
                : `${appointments.length} atendimento${appointments.length > 1 ? "s" : ""} agendado${appointments.length > 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentsList appointments={appointments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
