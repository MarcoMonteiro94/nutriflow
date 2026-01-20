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
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

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
  const selectedDate = params.date || new Date().toISOString().split("T")[0];

  const appointments = await getAppointments(selectedDate);
  const appointmentDates = await getAppointmentDates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus atendimentos e consultas.
          </p>
        </div>
        <Button asChild>
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
              selectedDate={new Date(selectedDate)}
              appointmentDates={appointmentDates}
            />
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Atendimentos do dia{" "}
              {new Date(selectedDate).toLocaleDateString("pt-BR", {
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
