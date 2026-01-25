import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import type { Appointment, Patient } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) {
    return null;
  }

  return patient as Patient;
}

async function getPatientAppointments(patientId: string): Promise<Appointment[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .eq("nutri_id", user.id)
    .order("scheduled_at", { ascending: false });

  return (data ?? []) as Appointment[];
}

function getStatusInfo(status: string) {
  switch (status) {
    case "scheduled":
      return {
        label: "Agendada",
        color: "bg-blue-100 text-blue-800",
        icon: Calendar
      };
    case "completed":
      return {
        label: "Realizada",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle2
      };
    case "cancelled":
      return {
        label: "Cancelada",
        color: "bg-red-100 text-red-800",
        icon: XCircle
      };
    case "rescheduled":
      return {
        label: "Reagendada",
        color: "bg-yellow-100 text-yellow-800",
        icon: RefreshCw
      };
    case "no_show":
      return {
        label: "Faltou",
        color: "bg-orange-100 text-orange-800",
        icon: AlertCircle
      };
    default:
      return {
        label: status,
        color: "bg-gray-100 text-gray-800",
        icon: Calendar
      };
  }
}

export default async function PatientAppointmentsPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const appointments = await getPatientAppointments(id);

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.scheduled_at) >= now && apt.status === "scheduled"
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.scheduled_at) < now || apt.status !== "scheduled"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/patients/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Histórico de Consultas
            </h1>
            <p className="text-muted-foreground">
              {patient.full_name}
            </p>
          </div>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/schedule/new?patient=${id}`}>
            <Plus className="mr-2 h-4 w-4" />
            Agendar Consulta
          </Link>
        </Button>
      </div>

      {/* No appointments */}
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              Nenhuma consulta registrada
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Este paciente ainda não possui consultas agendadas.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/schedule/new?patient=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Agendar Consulta
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Próximas Consultas</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingAppointments.map((appointment) => {
                  const status = getStatusInfo(appointment.status);
                  const StatusIcon = status.icon;
                  const scheduledDate = new Date(appointment.scheduled_at);

                  return (
                    <Card key={appointment.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {scheduledDate.toLocaleDateString("pt-BR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </CardTitle>
                          <span className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {scheduledDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {appointment.duration_minutes} min
                          </span>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {appointment.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past appointments */}
          {pastAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Histórico</h2>
              <div className="space-y-3">
                {pastAppointments.map((appointment) => {
                  const status = getStatusInfo(appointment.status);
                  const StatusIcon = status.icon;
                  const scheduledDate = new Date(appointment.scheduled_at);

                  return (
                    <Card key={appointment.id}>
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex-shrink-0">
                          <div className={`rounded-full p-2 ${status.color.replace('text-', 'text-opacity-100 ')}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {scheduledDate.toLocaleDateString("pt-BR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              às {scheduledDate.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground truncate">
                              {appointment.notes}
                            </p>
                          )}
                          {appointment.cancellation_reason && (
                            <p className="text-sm text-red-600">
                              Motivo: {appointment.cancellation_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center rounded-xl px-2 py-1 text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
