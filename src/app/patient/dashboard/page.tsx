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
  Clock
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
      <div className="p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Conta não vinculada</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
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

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Olá, {patient.full_name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">Bem-vindo ao seu painel de acompanhamento.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appointments?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Consultas agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Scale className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {latestMeasurement?.weight ? `${latestMeasurement.weight}kg` : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Último peso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próxima Consulta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments && appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.slice(0, 1).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground">
                      <span className="text-lg font-bold">
                        {format(new Date(apt.scheduled_at), "dd")}
                      </span>
                      <span className="text-xs">
                        {format(new Date(apt.scheduled_at), "MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(apt.scheduled_at), "EEEE", { locale: ptBR })}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(apt.scheduled_at), "HH:mm")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {apt.status === "scheduled" ? "Agendada" : apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma consulta agendada
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Meal Plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Meu Plano Alimentar
            </CardTitle>
            {mealPlan && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/patient/plan">
                  Ver plano
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {mealPlan ? (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{mealPlan.title || "Plano Alimentar"}</p>
                  {mealPlan.starts_at && mealPlan.ends_at && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mealPlan.starts_at), "dd/MM")} - {format(new Date(mealPlan.ends_at), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  Ativo
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum plano alimentar ativo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link href="/patient/plan">
            <UtensilsCrossed className="h-5 w-5" />
            <span className="text-xs">Ver Plano</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link href="/patient/progress">
            <Scale className="h-5 w-5" />
            <span className="text-xs">Meu Progresso</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
