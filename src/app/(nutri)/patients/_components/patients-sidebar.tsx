"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  Sparkles,
  Target,
  Clock
} from "lucide-react";
import Link from "next/link";
import type { Patient } from "@/types/database";

interface PatientsSidebarProps {
  patients: Patient[];
  totalCount: number;
  newThisWeek: number;
  withGoals: number;
  isReceptionist?: boolean;
}

export function PatientsSidebar({
  patients,
  totalCount,
  newThisWeek,
  withGoals,
  isReceptionist,
}: PatientsSidebarProps) {
  // Get recent patients (last 3)
  const recentPatients = patients
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="hidden lg:block"
    >
      <div className="sticky top-6 space-y-4">
        {/* Stats Card */}
        <div className="bg-card rounded-2xl border shadow-soft overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Resumo</h2>
                <p className="text-xs text-muted-foreground">
                  Visão geral dos pacientes
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Total Patients */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-xs text-muted-foreground">Pacientes ativos</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{totalCount}</span>
            </div>

            {/* New This Week */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Novos</p>
                  <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
                </div>
              </div>
              <span className="text-2xl font-bold">
                {newThisWeek}
              </span>
            </div>

            {/* With Goals */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Com objetivo</p>
                  <p className="text-xs text-muted-foreground">Meta definida</p>
                </div>
              </div>
              <span className="text-2xl font-bold">
                {withGoals}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        {recentPatients.length > 0 && (
          <div className="bg-card rounded-2xl border shadow-soft p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Cadastrados Recentemente
              </h3>
            </div>
            <div className="space-y-2">
              {recentPatients.map((patient) => {
                const initials = patient.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {patient.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(patient.created_at).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short"
                        })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border shadow-soft p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Ações Rápidas
          </h3>
          <div className="space-y-2">
            <Button asChild className="w-full rounded-full justify-start" size="sm">
              <Link href="/patients/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Paciente
              </Link>
            </Button>
            <Link
              href="/schedule"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-sm"
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Ver Agenda
            </Link>
            {!isReceptionist && (
              <Link
                href="/plans"
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-sm"
              >
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Ver Planos Alimentares
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
