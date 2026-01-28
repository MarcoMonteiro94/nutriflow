import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { ScheduleTimeline } from "./_components/schedule-timeline";
import { MobileCalendarDrawer } from "./_components/mobile-calendar-drawer";
import { DesktopCalendarSidebar } from "./_components/desktop-calendar-sidebar";
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

  const parsedSelectedDate = parseLocalDate(selectedDate);
  const isToday = new Date().toDateString() === parsedSelectedDate.toDateString();

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus atendimentos e consultas.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto rounded-full" size="lg">
          <Link href="/schedule/new">
            <Plus className="mr-2 h-5 w-5" />
            <span className="sm:hidden">Nova Consulta</span>
            <span className="hidden sm:inline">Agendar Consulta</span>
          </Link>
        </Button>
      </div>

      {/* Mobile Calendar Drawer */}
      <MobileCalendarDrawer
        selectedDate={parsedSelectedDate}
        appointmentDates={appointmentDates}
        blockedDates={blockedDates}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Timeline / Appointments */}
        <div className="order-2 lg:order-1">
          {/* Date header for mobile (when not today) */}
          <div className="lg:hidden mb-4">
            {timeBlocksForDay.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 mb-4">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      Bloqueios neste dia
                    </p>
                    <ul className="mt-1 space-y-0.5 text-amber-600 dark:text-amber-500 text-xs">
                      {timeBlocksForDay.map((block) => (
                        <li key={block.id}>
                          {block.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main content area */}
          <div className="bg-card rounded-2xl border shadow-soft p-4 sm:p-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">
                  {isToday ? "Consultas de Hoje" : (
                    <>
                      <span className="hidden sm:inline">Consultas de </span>
                      {parsedSelectedDate.toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {appointments.length === 0
                    ? "Nenhum atendimento agendado"
                    : `${appointments.length} atendimento${appointments.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <ScheduleTimeline
              appointments={appointments}
              selectedDate={parsedSelectedDate}
            />
          </div>
        </div>

        {/* Desktop Calendar Sidebar */}
        <div className="order-1 lg:order-2">
          <DesktopCalendarSidebar
            selectedDate={parsedSelectedDate}
            appointmentDates={appointmentDates}
            blockedDates={blockedDates}
            timeBlocksForDay={timeBlocksForDay}
            appointmentCount={appointments.length}
          />
        </div>
      </div>
    </div>
  );
}
