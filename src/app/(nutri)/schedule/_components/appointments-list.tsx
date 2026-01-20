"use client";

import { Button } from "@/components/ui/button";
import { Clock, User, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import type { Appointment } from "@/types/database";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppointmentsListProps {
  appointments: (Appointment & {
    patients: {
      id: string;
      full_name: string;
    } | null;
  })[];
}

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">
          Nenhum atendimento
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Não há consultas agendadas para este dia.
        </p>
        <Button asChild className="mt-4">
          <Link href="/schedule/new">Agendar Consulta</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => {
        const scheduledAt = new Date(appointment.scheduled_at);
        const endTime = new Date(
          scheduledAt.getTime() + appointment.duration_minutes * 60000
        );

        return (
          <div
            key={appointment.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="text-lg font-bold">
                  {scheduledAt.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Link
                    href={`/patients/${appointment.patients?.id}`}
                    className="font-medium hover:underline"
                  >
                    {appointment.patients?.full_name ?? "Paciente"}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {scheduledAt.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {endTime.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ({appointment.duration_minutes} min)
                  </span>
                </div>
                {appointment.notes && (
                  <p className="mt-1 text-sm text-muted-foreground truncate max-w-md">
                    {appointment.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  appointment.status === "scheduled"
                    ? "bg-blue-100 text-blue-800"
                    : appointment.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : appointment.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {appointment.status === "scheduled" && "Agendado"}
                {appointment.status === "completed" && "Realizado"}
                {appointment.status === "cancelled" && "Cancelado"}
                {!["scheduled", "completed", "cancelled"].includes(
                  appointment.status
                ) && appointment.status}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/schedule/${appointment.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
