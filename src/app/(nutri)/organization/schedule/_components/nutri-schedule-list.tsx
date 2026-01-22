"use client";

import { Badge } from "@/components/ui/badge";
import { User, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Appointment } from "@/types/database";

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

interface NutriScheduleListProps {
  appointments: AppointmentWithDetails[];
}

type AppointmentStatus = "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";

const statusConfig: Record<AppointmentStatus, { label: string; color: string; icon: typeof Calendar }> = {
  scheduled: {
    label: "Agendado",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: Calendar,
  },
  confirmed: {
    label: "Confirmado",
    color: "bg-green-500/10 text-green-600 border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500/10 text-red-600 border-red-200",
    icon: XCircle,
  },
  completed: {
    label: "Concluído",
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
    icon: CheckCircle,
  },
  no_show: {
    label: "Não compareceu",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    icon: AlertCircle,
  },
};

export function NutriScheduleList({ appointments }: NutriScheduleListProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          Nenhum atendimento agendado para este dia.
        </p>
      </div>
    );
  }

  // Group appointments by nutritionist
  const groupedByNutri = appointments.reduce(
    (acc, appointment) => {
      const nutriId = appointment.nutri_id;
      const nutriName = appointment.profiles?.full_name || "Nutricionista";

      if (!acc[nutriId]) {
        acc[nutriId] = {
          nutriName,
          appointments: [],
        };
      }

      acc[nutriId].appointments.push(appointment);
      return acc;
    },
    {} as Record<string, { nutriName: string; appointments: AppointmentWithDetails[] }>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedByNutri).map(([nutriId, { nutriName, appointments }]) => (
        <div key={nutriId} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">{nutriName}</span>
            <Badge variant="secondary" className="text-xs">
              {appointments.length} atendimento{appointments.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
            {appointments.map((appointment) => {
              const status = statusConfig[appointment.status as AppointmentStatus];
              const StatusIcon = status.icon;
              const scheduledAt = new Date(appointment.scheduled_at);

              return (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-lg font-semibold">
                        {scheduledAt.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium">
                        {appointment.patients?.full_name || "Paciente não informado"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{appointment.duration_minutes} min</span>
                        {appointment.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{appointment.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className={status.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
