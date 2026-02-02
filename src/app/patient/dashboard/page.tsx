import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CalendarDays,
  ClipboardList,
  Scale,
  UtensilsCrossed,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function PatientDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get patient record linked to this user
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, nutri_id")
    .eq("user_id", user.id)
    .single();

  if (!patient) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <ClipboardList className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Conta não vinculada</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Sua conta ainda não está vinculada a um perfil de paciente.
              Entre em contato com seu nutricionista para vincular sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get upcoming appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, scheduled_at, status, notes")
    .eq("patient_id", patient.id)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(3);

  // Get active meal plan
  const { data: mealPlan } = await supabase
    .from("meal_plans")
    .select("id, title, starts_at, ends_at, status")
    .eq("patient_id", patient.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get latest measurement
  const { data: latestMeasurement } = await supabase
    .from("measurements")
    .select("id, measured_at, weight, body_fat_percentage")
    .eq("patient_id", patient.id)
    .order("measured_at", { ascending: false })
    .limit(1)
    .single();

  const firstName = patient.full_name.split(" ")[0];
  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">{greeting}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
          Olá, {firstName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Acompanhe seu progresso e mantenha o foco nos seus objetivos.
        </p>
      </div>

      {/* Mobile Priority: Next Appointment & Meal Plan */}
      <div className="space-y-4 mb-6 lg:hidden">
        {/* Next Appointment - Mobile */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Próxima Consulta</CardTitle>
                <CardDescription className="text-xs">Seu agendamento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {appointments && appointments.length > 0 ? (
              <div
                className="flex items-center gap-4 rounded-xl p-3 bg-primary/5 ring-1 ring-primary/20"
              >
                <div
                  className="flex flex-col items-center justify-center rounded-lg px-3 py-2 bg-primary text-primary-foreground"
                >
                  <span className="text-lg font-bold">
                    {format(new Date(appointments[0].scheduled_at), "dd")}
                  </span>
                  <span className="text-[10px] uppercase">
                    {format(new Date(appointments[0].scheduled_at), "MMM", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize">
                    {format(new Date(appointments[0].scheduled_at), "EEEE", {
                      locale: ptBR,
                    })}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(appointments[0].scheduled_at), "HH:mm")}
                  </div>
                </div>
                <Badge variant="default" className="bg-primary">
                  Agendada
                </Badge>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-2 rounded-full bg-muted p-2">
                  <Calendar className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhuma consulta agendada
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Plan - Mobile */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Meu Plano Alimentar</CardTitle>
                  <CardDescription className="text-xs">
                    {mealPlan
                      ? "Seu plano personalizado"
                      : "Aguardando plano"}
                  </CardDescription>
                </div>
              </div>
              {mealPlan && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/patient/plan">
                    Ver
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {mealPlan ? (
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {mealPlan.title || "Plano Alimentar"}
                    </p>
                    {mealPlan.starts_at && mealPlan.ends_at && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {format(new Date(mealPlan.starts_at), "dd/MM")} -{" "}
                        {format(new Date(mealPlan.ends_at), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 text-xs">
                    Ativo
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-2 rounded-full bg-muted p-2">
                  <UtensilsCrossed className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum plano alimentar ativo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Stats & Quick Actions */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Stats */}
          <div className="grid gap-3 grid-cols-3">
            <Card className="rounded-2xl">
              <CardContent className="p-3 sm:p-4">
                {/* Mobile: vertical centered */}
                <div className="flex flex-col items-center text-center gap-1 sm:hidden">
                  <CalendarDays className="h-5 w-5 mb-1 text-muted-foreground" />
                  <p className="text-xl font-semibold tabular-nums">
                    {appointments?.length || 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Consultas</p>
                </div>
                {/* Desktop: horizontal with icon box */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">
                      {appointments?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Consultas agendadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-3 sm:p-4">
                {/* Mobile: vertical centered */}
                <div className="flex flex-col items-center text-center gap-1 sm:hidden">
                  <Scale className="h-5 w-5 mb-1 text-muted-foreground" />
                  <p className="text-xl font-semibold tabular-nums">
                    {latestMeasurement?.weight
                      ? `${latestMeasurement.weight}`
                      : "-"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {latestMeasurement?.weight ? "kg" : "Peso"}
                  </p>
                </div>
                {/* Desktop: horizontal with icon box */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <Scale className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">
                      {latestMeasurement?.weight
                        ? `${latestMeasurement.weight}kg`
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Último peso</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-3 sm:p-4">
                {/* Mobile: vertical centered */}
                <div className="flex flex-col items-center text-center gap-1 sm:hidden">
                  <TrendingUp className="h-5 w-5 mb-1 text-muted-foreground" />
                  <p className="text-xl font-semibold tabular-nums">
                    {latestMeasurement?.body_fat_percentage
                      ? `${latestMeasurement.body_fat_percentage}`
                      : "-"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {latestMeasurement?.body_fat_percentage ? "% gordura" : "Gordura"}
                  </p>
                </div>
                {/* Desktop: horizontal with icon box */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">
                      {latestMeasurement?.body_fat_percentage
                        ? `${latestMeasurement.body_fat_percentage}%`
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Gordura corporal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meal Plan Card - Desktop only */}
          <Card className="hidden lg:block">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Meu Plano Alimentar</CardTitle>
                    <CardDescription>
                      {mealPlan
                        ? "Seu plano personalizado"
                        : "Aguardando plano do nutricionista"}
                    </CardDescription>
                  </div>
                </div>
                {mealPlan && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/patient/plan">
                      Ver plano
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {mealPlan ? (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {mealPlan.title || "Plano Alimentar"}
                      </p>
                      {mealPlan.starts_at && mealPlan.ends_at && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {format(new Date(mealPlan.starts_at), "dd/MM")} -{" "}
                          {format(new Date(mealPlan.ends_at), "dd/MM/yyyy")}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                      Ativo
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-full bg-muted p-3">
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhum plano alimentar ativo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              asChild
              variant="outline"
              className="h-auto justify-start gap-4 p-4"
            >
              <Link href="/patient/plan">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Ver Plano</p>
                  <p className="text-xs text-muted-foreground">
                    Suas refeições do dia
                  </p>
                </div>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto justify-start gap-4 p-4"
            >
              <Link href="/patient/progress">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Meu Progresso</p>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe sua evolução
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column - Next Appointment (Desktop only) */}
        <div className="hidden lg:block space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Próxima Consulta</CardTitle>
                  <CardDescription>Seu agendamento</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {appointments && appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 2).map((apt, index) => (
                    <div
                      key={apt.id}
                      className={`flex items-center gap-4 rounded-xl p-3 ${
                        index === 0 ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"
                      }`}
                    >
                      <div
                        className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 ${
                          index === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <span className="text-lg font-bold">
                          {format(new Date(apt.scheduled_at), "dd")}
                        </span>
                        <span className="text-[10px] uppercase">
                          {format(new Date(apt.scheduled_at), "MMM", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {format(new Date(apt.scheduled_at), "EEEE", {
                            locale: ptBR,
                          })}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(apt.scheduled_at), "HH:mm")}
                        </div>
                      </div>
                      <Badge
                        variant={index === 0 ? "default" : "outline"}
                        className={index === 0 ? "bg-primary" : ""}
                      >
                        {apt.status === "scheduled" ? "Agendada" : apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-full bg-muted p-3">
                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma consulta agendada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Motivational Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="mb-3 text-4xl">💪</div>
              <p className="font-medium">Continue assim!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada escolha saudável conta. Mantenha o foco e celebre suas
                pequenas vitórias.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}
