"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Check,
  Clock,
  Plus,
  RefreshCw,
  X,
  UserX,
} from "lucide-react";
import type { AppointmentHistory as AppointmentHistoryType } from "@/types/database";
import { getActionLabel } from "@/lib/queries/appointments";

interface AppointmentHistoryProps {
  history: AppointmentHistoryType[];
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  rescheduled: RefreshCw,
  cancelled: X,
  completed: Check,
  no_show: UserX,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-blue-500/10 text-blue-600",
  rescheduled: "bg-yellow-500/10 text-yellow-600",
  cancelled: "bg-red-500/10 text-red-600",
  completed: "bg-green-500/10 text-green-600",
  no_show: "bg-orange-500/10 text-orange-600",
};

export function AppointmentHistory({ history }: AppointmentHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
        <Clock className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum histórico registrado
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Timeline line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

      {history.map((entry, index) => {
        const Icon = ACTION_ICONS[entry.action] || Clock;
        const colorClass = ACTION_COLORS[entry.action] || "bg-muted text-muted-foreground";

        return (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Icon */}
            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium">
                {getActionLabel(entry.action)}
              </p>

              {entry.action === "rescheduled" &&
                entry.old_datetime &&
                entry.new_datetime && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    De{" "}
                    <span className="font-medium">
                      {format(new Date(entry.old_datetime), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>{" "}
                    para{" "}
                    <span className="font-medium">
                      {format(new Date(entry.new_datetime), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </p>
                )}

              {entry.reason && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Motivo: {entry.reason}
                </p>
              )}

              {entry.created_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
