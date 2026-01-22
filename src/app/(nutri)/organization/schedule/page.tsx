import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { getUserOrganizations, getOrganizationMembers } from "@/lib/queries/organization";
import { ConsolidatedCalendar } from "./_components/consolidated-calendar";
import { NutriScheduleList } from "./_components/nutri-schedule-list";
import type { Appointment } from "@/types/database";

interface SearchParams {
  date?: string;
  nutri?: string;
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

type AppointmentWithDetails = Appointment & {
  patients: {
    id: string;
    full_name: string;
  } | null;
  profiles: {
    id: string;
    full_name: string;
  } | null;
};

async function getOrganizationAppointments(
  organizationId: string,
  selectedDate?: string,
  nutriId?: string
): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient();

  // Get all member user IDs for this organization
  const members = await getOrganizationMembers(organizationId);
  const nutriIds = members
    .filter((m) => m.role === "nutri" || m.role === "admin")
    .filter((m) => m.status === "active")
    .map((m) => m.user_id);

  if (nutriIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients (
        id,
        full_name
      ),
      profiles!appointments_nutri_id_fkey (
        id,
        full_name
      )
    `)
    .in("nutri_id", nutriIds)
    .order("scheduled_at", { ascending: true });

  if (nutriId && nutriIds.includes(nutriId)) {
    query = query.eq("nutri_id", nutriId);
  }

  if (selectedDate) {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    query = query
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString());
  }

  const { data } = await query;

  return (data ?? []) as AppointmentWithDetails[];
}

async function getAppointmentDatesForOrganization(organizationId: string): Promise<Date[]> {
  const supabase = await createClient();

  const members = await getOrganizationMembers(organizationId);
  const nutriIds = members
    .filter((m) => m.role === "nutri" || m.role === "admin")
    .filter((m) => m.status === "active")
    .map((m) => m.user_id);

  if (nutriIds.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("appointments")
    .select("scheduled_at")
    .in("nutri_id", nutriIds);

  if (!data) return [];

  return data.map((a) => new Date(a.scheduled_at));
}

export default async function OrganizationSchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedDate = params.date || formatLocalDate(new Date());
  const selectedNutri = params.nutri || "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's organization where they are admin
  const organizations = await getUserOrganizations();
  const organization = organizations[0];

  if (!organization) {
    redirect("/organization");
  }

  // Check if user is admin
  const members = await getOrganizationMembers(organization.id);
  const currentMember = members.find((m) => m.user_id === user.id);

  if (!currentMember || currentMember.role !== "admin") {
    redirect("/organization/dashboard");
  }

  // Get nutris for filter
  const nutris = members
    .filter((m) => (m.role === "nutri" || m.role === "admin") && m.status === "active")
    .map((m) => ({
      id: m.user_id,
      name: m.profiles.full_name,
    }));

  const [appointments, appointmentDates] = await Promise.all([
    getOrganizationAppointments(organization.id, selectedDate, selectedNutri),
    getAppointmentDatesForOrganization(organization.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda da Clínica</h1>
          <p className="text-muted-foreground">
            Visualize todos os atendimentos da sua clínica.
          </p>
        </div>
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
            <ConsolidatedCalendar
              selectedDate={parseLocalDate(selectedDate)}
              appointmentDates={appointmentDates}
              nutris={nutris}
              selectedNutri={selectedNutri}
            />
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
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
            <NutriScheduleList appointments={appointments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
