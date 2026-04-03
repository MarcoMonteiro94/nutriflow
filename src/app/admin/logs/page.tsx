"use client";

import { useEffect, useState } from "react";
import { ScrollText, Calendar, Filter } from "lucide-react";

import type { AuditLogEntry } from "@/types/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ACTION_LABELS: Record<string, string> = {
  "patient.link_account": "Paciente vinculado",
  "patient.unlink_account": "Paciente desvinculado",
  "patient.export_data": "Dados exportados",
  "patient.create": "Paciente criado",
  "invite.create": "Convite criado",
  "invite.accept": "Convite aceito",
  "member.role_change": "Cargo alterado",
  "member.remove": "Membro removido",
  "anamnesis.analyze": "Anamnese analisada",
  "token.create": "Token criado",
  "token.access": "Token acessado",
  "org.create": "Clínica criada",
  "org.deactivate": "Clínica desativada",
  "org.reactivate": "Clínica reativada",
  "user.deactivate": "Usuário desativado",
  "user.reactivate": "Usuário reativado",
};

const ACTION_BADGE_STYLE: Record<string, string> = {
  "org.deactivate":
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  "user.deactivate":
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  "org.reactivate":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "user.reactivate":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "invite.create":
    "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  "invite.accept":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "org.create":
    "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  "member.remove":
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

function LogSkeleton() {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (actionFilter && actionFilter !== "all")
        params.set("action", actionFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", `${dateTo}T23:59:59`);

      try {
        const res = await fetch(`/api/admin/audit-logs?${params}`);
        if (!res.ok) {
          setError("Erro ao carregar logs");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setLogs(json.data ?? []);
      } catch {
        setError("Erro ao carregar logs");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [actionFilter, dateFrom, dateTo]);

  function clearFilters() {
    setActionFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  const hasFilters =
    actionFilter !== "all" || dateFrom !== "" || dateTo !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logs de Auditoria</h1>
        <p className="text-muted-foreground">
          Acompanhe as ações realizadas na plataforma
        </p>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Ação
              </Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger data-testid="log-action-filter">
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([action, label]) => (
                    <SelectItem key={action} value={action}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> De
              </Label>
              <Input
                type="date"
                data-testid="log-date-from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || formatDateForInput(new Date())}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Até
              </Label>
              <Input
                type="date"
                data-testid="log-date-to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom}
                max={formatDateForInput(new Date())}
              />
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Count */}
      {!loading && !error && (
        <p data-testid="log-count" className="text-sm text-muted-foreground">
          {logs.length} {logs.length === 1 ? "registro" : "registros"}{" "}
          encontrado{logs.length === 1 ? "" : "s"}
        </p>
      )}

      {/* Error state */}
      {error && (
        <Card className="rounded-2xl border-destructive/50 shadow-soft">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LogSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && logs.length === 0 && (
        <Card
          data-testid="log-empty-state"
          className="rounded-2xl shadow-soft"
        >
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum log encontrado</p>
            <p className="text-xs text-muted-foreground">
              {hasFilters
                ? "Ajuste os filtros para encontrar registros."
                : "Ainda não há ações registradas."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Log list */}
      {!loading && !error && logs.length > 0 && (
        <div data-testid="log-list" className="space-y-3">
          {logs.map((log) => (
            <Card
              key={log.id}
              data-testid="log-entry"
              className="rounded-2xl shadow-soft"
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <ScrollText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          data-testid="log-action-badge"
                          variant="secondary"
                          className={
                            ACTION_BADGE_STYLE[log.action] ??
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {ACTION_LABELS[log.action] ?? log.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {log.resource_type}
                          {log.resource_id
                            ? ` · ${log.resource_id.slice(0, 8)}...`
                            : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {log.user
                          ? `${log.user.full_name} (${log.user.email})`
                          : "Sistema"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <Calendar className="h-3 w-3" />
                    {formatDateTime(log.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
