"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Check,
  XCircle,
  UserX,
  Loader2,
  History,
  Clock,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Appointment, AppointmentHistory } from "@/types/database";

interface AppointmentActionsDialogProps {
  appointment: Appointment;
  children: React.ReactNode;
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

const ACTION_LABELS: Record<string, string> = {
  created: "Criado",
  rescheduled: "Reagendado",
  cancelled: "Cancelado",
  completed: "Realizado",
  no_show: "Não compareceu",
};

export function AppointmentActionsDialog({
  appointment,
  children,
}: AppointmentActionsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<
    "complete" | "cancel" | "no_show" | null
  >(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("appointment_history")
        .select("*")
        .eq("appointment_id", appointment.id)
        .order("created_at", { ascending: false });

      setHistory((data ?? []) as AppointmentHistory[]);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleAction() {
    if (!action) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const updates: Record<string, unknown> = {};

      switch (action) {
        case "complete":
          updates.status = "completed";
          break;
        case "cancel":
          updates.status = "cancelled";
          updates.cancelled_at = new Date().toISOString();
          updates.cancellation_reason = reason.trim() || null;
          break;
        case "no_show":
          updates.status = "no_show";
          break;
      }

      const { error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", appointment.id);

      if (error) throw error;

      setOpen(false);
      setAction(null);
      setReason("");
      router.refresh();
    } catch (err) {
      console.error("Error updating appointment:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Consulta</DialogTitle>
          <DialogDescription>
            {format(new Date(appointment.scheduled_at), "PPP 'às' HH:mm", {
              locale: ptBR,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Actions */}
          {!isCompleted && !isCancelled && (
            <div className="space-y-3">
              <Label>Ações</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  variant={action === "complete" ? "default" : "outline"}
                  onClick={() => setAction("complete")}
                  className="justify-start"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Realizada
                </Button>
                <Button
                  variant={action === "no_show" ? "default" : "outline"}
                  onClick={() => setAction("no_show")}
                  className="justify-start"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Não veio
                </Button>
                <Button
                  variant={action === "cancel" ? "destructive" : "outline"}
                  onClick={() => setAction("cancel")}
                  className="justify-start"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>

              {action === "cancel" && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo do cancelamento</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Informe o motivo (opcional)"
                    rows={2}
                  />
                </div>
              )}

              {action && (
                <Button
                  onClick={handleAction}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar
                </Button>
              )}
            </div>
          )}

          {/* History */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </Label>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Nenhum histórico registrado
              </div>
            ) : (
              <div className="relative space-y-0 max-h-[200px] overflow-y-auto">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

                {history.map((entry) => {
                  const Icon = ACTION_ICONS[entry.action] || Clock;
                  const colorClass =
                    ACTION_COLORS[entry.action] ||
                    "bg-muted text-muted-foreground";

                  return (
                    <div
                      key={entry.id}
                      className="relative flex gap-4 pb-4 last:pb-0"
                    >
                      <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium">
                          {ACTION_LABELS[entry.action] || entry.action}
                        </p>

                        {entry.action === "rescheduled" &&
                          entry.old_datetime &&
                          entry.new_datetime && (
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(entry.old_datetime),
                                "dd/MM HH:mm"
                              )}{" "}
                              →{" "}
                              {format(
                                new Date(entry.new_datetime),
                                "dd/MM HH:mm"
                              )}
                            </p>
                          )}

                        {entry.reason && (
                          <p className="text-xs text-muted-foreground">
                            {entry.reason}
                          </p>
                        )}

                        {entry.created_at && (
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(entry.created_at),
                              "dd/MM/yy HH:mm"
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
