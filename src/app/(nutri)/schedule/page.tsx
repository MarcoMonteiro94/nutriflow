import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ScheduleCalendar } from "./_components/schedule-calendar";
import { AppointmentsList } from "./_components/appointments-list";
import { getUserRole } from "@/lib/auth/authorization";
import type { Appointment, NutriTimeBlock } from "@/types/database";

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

  const userRole = await getUserRole();
  const isReceptionist = userRole?.role === "receptionist";

  // For receptionists, let RLS handle the filtering (they see all org appointments)
  // For nutris, filter to their own appointments
  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients (
        id,
        full_name
      )
    `)
    .order("scheduled_at", { ascending: true });

  if (!isReceptionist) {
    query = query.eq("nutri_id", user.id);
  }

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

  const userRole = await getUserRole();
  const isReceptionist = userRole?.role === "receptionist";

  let query = supabase
    .from("appointments")
    .select("scheduled_at");

  if (!isReceptionist) {
    query = query.eq("nutri_id", user.id);
  }

  const { data } = await query;

  if (!data) return [];

  return data.map((a) => new Date(a.scheduled_at));
}

async function getBlockedDates(): Promise<Date[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get time blocks for the next 90 days
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);

  const { data } = await supabase
    .from("nutri_time_blocks")
    .select("*")
    .eq("nutri_id", user.id)
    .gte("end_datetime", now.toISOString())
    .lte("start_datetime", futureDate.toISOString());

  const blocks = (data ?? []) as NutriTimeBlock[];

  // Generate all dates that fall within time blocks
  const blockedDates: Date[] = [];

  for (const block of blocks) {
    const blockStart = new Date(block.start_datetime);
    const blockEnd = new Date(block.end_datetime);

    // Iterate through each day in the block range
    const currentDate = new Date(blockStart);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= blockEnd) {
      blockedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return blockedDates;
}

async function getTimeBlocksForDate(dateStr: string): Promise<NutriTimeBlock[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  const { data } = await supabase
    .from("nutri_time_blocks")
    .select("*")
    .eq("nutri_id", user.id)
    .lte("start_datetime", endOfDay.toISOString())
    .gte("end_datetime", startOfDay.toISOString());

  return (data ?? []) as NutriTimeBlock[];
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedDate = params.date || formatLocalDate(new Date());

  const [appointments, appointmentDates, blockedDates, timeBlocksForDay] = await Promise.all([
    getAppointments(selectedDate),
    getAppointmentDates(),
    getBlockedDates(),
    getTimeBlocksForDate(selectedDate),
  ]);

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
              blockedDates={blockedDates}
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
          <CardContent className="space-y-4">
            {timeBlocksForDay.length > 0 && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">
                      Bloqueios neste dia:
                    </p>
                    <ul className="mt-1 space-y-1 text-yellow-600 dark:text-yellow-500">
                      {timeBlocksForDay.map((block) => (
                        <li key={block.id}>
                          {block.title}
                          {block.block_type !== "other" && (
                            <span className="text-xs ml-1">
                              ({block.block_type === "personal" ? "Pessoal" :
                                block.block_type === "holiday" ? "Feriado" :
                                block.block_type === "vacation" ? "Férias" : block.block_type})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <AppointmentsList appointments={appointments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
