import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, TrendingUp, Users, UtensilsCrossed, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function getDashboardStats() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalPatients: 0,
      activePlans: 0,
      todayAppointments: 0,
      upcomingAppointments: [],
    };
  }

  // Get total patients count
  const { count: totalPatients } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("nutri_id", user.id);

  // Get active meal plans count
  const { count: activePlans } = await supabase
    .from("meal_plans")
    .select("*", { count: "exact", head: true })
    .eq("nutri_id", user.id)
    .eq("status", "active");

  // Get today's appointments
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { count: todayAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("nutri_id", user.id)
    .gte("scheduled_at", startOfDay)
    .lte("scheduled_at", endOfDay);

  // Get upcoming appointments (next 5)
  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      patients (
        id,
        full_name
      )
    `)
    .eq("nutri_id", user.id)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5);

  return {
    totalPatients: totalPatients ?? 0,
    activePlans: activePlans ?? 0,
    todayAppointments: todayAppointments ?? 0,
    upcomingAppointments: upcomingAppointments ?? [],
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao NutriFlow. Veja o resumo dos seus atendimentos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/patients/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Link>
          </Button>
          <Button asChild>
            <Link href="/plans/new">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Novo Plano
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePlans}</div>
            <p className="text-xs text-muted-foreground">
              Planos alimentares em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Consultas Hoje
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Atendimentos agendados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Adesão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <p className="text-xs text-muted-foreground">
              Média dos pacientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-4">
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
              <div className="space-y-4">
                {stats.upcomingAppointments.map((appointment) => {
                  const patient = appointment.patients as { id: string; full_name: string } | null;
                  const scheduledAt = new Date(appointment.scheduled_at);

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {patient?.full_name ?? "Paciente"}
                          </p>
                          <p className="text-sm text-muted-foreground">
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
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/patients/${patient?.id}`}>
                          Ver paciente
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
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
      </div>
    </div>
  );
}
