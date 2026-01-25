import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, UtensilsCrossed, Calendar, FileText } from "lucide-react";
import type { MealPlan, Patient } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

type MealPlanWithMealsCount = MealPlan & {
  meals: { count: number }[];
};

async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) {
    return null;
  }

  return patient as Patient;
}

async function getPatientPlans(patientId: string): Promise<MealPlanWithMealsCount[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("meal_plans")
    .select(`
      *,
      meals (count)
    `)
    .eq("patient_id", patientId)
    .eq("nutri_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as MealPlanWithMealsCount[];
}

function getStatusLabel(status: "active" | "archived") {
  switch (status) {
    case "active":
      return { label: "Ativo", color: "bg-green-100 text-green-800" };
    case "archived":
      return { label: "Arquivado", color: "bg-gray-100 text-gray-800" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800" };
  }
}

export default async function PatientPlansPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const plans = await getPatientPlans(id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/patients/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Planos Alimentares
            </h1>
            <p className="text-muted-foreground">
              {patient.full_name}
            </p>
          </div>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/plans/new?patient=${id}`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Link>
        </Button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              Nenhum plano cadastrado
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Este paciente ainda não possui planos alimentares.
              Crie o primeiro plano para começar.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/plans/new?patient=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Plano
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const status = getStatusLabel(plan.status);
            const mealsCount = plan.meals?.[0]?.count ?? 0;

            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">
                      {plan.title || "Plano sem título"}
                    </CardTitle>
                    <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {plan.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UtensilsCrossed className="h-4 w-4" />
                    <span>{mealsCount} refeição{mealsCount !== 1 ? "ões" : ""}</span>
                  </div>
                  {plan.starts_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(plan.starts_at).toLocaleDateString("pt-BR")}
                        {plan.ends_at && ` - ${new Date(plan.ends_at).toLocaleDateString("pt-BR")}`}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/plans/${plan.id}`}>
                        Ver Plano
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/plans/${plan.id}/edit`}>
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
