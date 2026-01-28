"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  User,
  MoreHorizontal,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/database";
import { RescheduleDialog } from "./reschedule-dialog";
import { AppointmentActionsDialog } from "./appointment-actions-dialog";

interface ScheduleTimelineProps {
  appointments: (Appointment & {
    patients: {
      id: string;
      full_name: string;
    } | null;
  })[];
  selectedDate: Date;
}

const statusConfig = {
  scheduled: {
    label: "Agendado",
    color: "bg-sky-500",
    lightBg: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    icon: Clock,
  },
  completed: {
    label: "Realizado",
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-rose-500",
    lightBg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    icon: XCircle,
  },
} as const;

function TimeSlot({ time, isNow }: { time: string; isNow: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm font-medium tabular-nums",
      isNow ? "text-primary" : "text-muted-foreground"
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isNow ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
      )} />
      {time}
    </div>
  );
}

function AppointmentCard({
  appointment,
  index
}: {
  appointment: ScheduleTimelineProps["appointments"][0];
  index: number;
}) {
  const scheduledAt = new Date(appointment.scheduled_at);
  const endTime = new Date(scheduledAt.getTime() + appointment.duration_minutes * 60000);
  const now = new Date();
  const isOngoing = now >= scheduledAt && now <= endTime;
  const isPast = now > endTime;

  const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative pl-8 pb-8 last:pb-0"
    >
      {/* Timeline line */}
      <div className="absolute left-[11px] top-3 bottom-0 w-[2px] bg-gradient-to-b from-border via-border to-transparent last:hidden" />

      {/* Timeline dot */}
      <div className={cn(
        "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-background",
        status.color
      )}>
        <StatusIcon className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "relative rounded-2xl border-2 p-4 transition-all duration-200",
          status.lightBg,
          status.border,
          isOngoing && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          isPast && appointment.status === "scheduled" && "opacity-60"
        )}
      >
        {/* Ongoing indicator */}
        {isOngoing && appointment.status === "scheduled" && (
          <div className="absolute -top-3 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Em andamento
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Time range */}
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold tabular-nums">
                {scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                {" — "}
                {endTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-xs text-muted-foreground">
                ({appointment.duration_minutes}min)
              </span>
            </div>

            {/* Patient name */}
            <Link
              href={`/patients/${appointment.patients?.id}`}
              className="group flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {appointment.patients?.full_name ?? "Paciente"}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>

            {/* Notes */}
            {appointment.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 pl-10">
                {appointment.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn(
              "hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              status.lightBg,
              status.text
            )}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>

            <RescheduleDialog appointment={appointment}>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </RescheduleDialog>

            <AppointmentActionsDialog appointment={appointment}>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </AppointmentActionsDialog>
          </div>
        </div>

        {/* Mobile status badge */}
        <div className={cn(
          "sm:hidden mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
          status.lightBg,
          status.text
        )}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ScheduleTimeline({ appointments, selectedDate }: ScheduleTimelineProps) {
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  if (appointments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6">
          <Calendar className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Dia livre
        </h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          {isToday
            ? "Você não tem consultas agendadas para hoje. Aproveite para organizar suas anotações!"
            : "Não há consultas agendadas para este dia."
          }
        </p>
        <Button asChild size="lg" className="rounded-full px-6">
          <Link href="/schedule/new">
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Consulta
          </Link>
        </Button>
      </motion.div>
    );
  }

  // Group appointments by hour
  const groupedByHour = appointments.reduce((acc, appointment) => {
    const hour = new Date(appointment.scheduled_at).getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(appointment);
    return acc;
  }, {} as Record<number, typeof appointments>);

  return (
    <div className="relative">
      {/* Current time indicator for today */}
      {isToday && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 mb-6 pb-4 border-b"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {appointments.length} consulta{appointments.length !== 1 ? "s" : ""} hoje
          </span>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="space-y-0">
        {appointments.map((appointment, index) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
