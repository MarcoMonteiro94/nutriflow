"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { CalendarDays, Plus, TrendingUp, Users, UtensilsCrossed, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageTransition, StaggerList, StaggerItem, FadeIn } from "@/components/motion";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  patients: { id: string; full_name: string } | null;
}

interface DashboardStats {
  totalPatients: number;
  activePlans: number;
  todayAppointments: number;
  upcomingAppointments: Appointment[];
}

interface DashboardContentProps {
  stats: DashboardStats;
}

export function DashboardContent({ stats }: DashboardContentProps) {
  return (
    <PageTransition className="space-y-6">
      <FadeIn direction="down" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao NutriFlow. Veja o resumo dos seus atendimentos.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/patients/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/plans/new">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Novo Plano
            </Link>
          </Button>
        </div>
      </FadeIn>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Pacientes"
          value={stats.totalPatients}
          description="Pacientes cadastrados"
          icon={Users}
          iconColor="blue"
          index={0}
        />
        <StatsCard
          title="Planos Ativos"
          value={stats.activePlans}
          description="Planos em andamento"
          icon={UtensilsCrossed}
          iconColor="primary"
          index={1}
        />
        <StatsCard
          title="Consultas Hoje"
          value={stats.todayAppointments}
          description="Atendimentos agendados"
          icon={CalendarDays}
          iconColor="green"
          index={2}
        />
        <StatsCard
          title="Taxa de Adesão"
          value="--%"
          description="Média dos pacientes"
          icon={TrendingUp}
          iconColor="purple"
          index={3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Appointments */}
        <FadeIn delay={0.3} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Próximos Atendimentos</CardTitle>
                <CardDescription>
                  Suas consultas agendadas para os próximos dias
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/schedule">
                  Ver agenda
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Nenhum atendimento agendado
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Comece agendando uma consulta com seus pacientes.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/schedule/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Agendar Consulta
                    </Link>
                  </Button>
                </div>
              ) : (
                <StaggerList className="space-y-4">
                  {stats.upcomingAppointments.map((appointment) => {
                    const patient = appointment.patients;
                    const scheduledAt = new Date(appointment.scheduled_at);

                    return (
                      <StaggerItem
                        key={appointment.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-accent/30 p-4 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {patient?.full_name ?? "Paciente"}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              {scheduledAt.toLocaleDateString("pt-BR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              às{" "}
                              {scheduledAt.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <Link href={`/patients/${patient?.id}`}>
                            <span className="hidden sm:inline">Ver paciente</span>
                            <ArrowRight className="h-4 w-4 sm:hidden" />
                          </Link>
                        </Button>
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn delay={0.4} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as funções mais usadas
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/patients/new">
                  <Users className="mr-2 h-4 w-4" />
                  Cadastrar Novo Paciente
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/plans/new">
                  <UtensilsCrossed className="mr-2 h-4 w-4" />
                  Criar Plano Alimentar
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/schedule/new">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Agendar Consulta
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/patients">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Ver Todos os Pacientes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
