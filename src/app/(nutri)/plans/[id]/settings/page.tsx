import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MealPlanForm } from "../../_components/meal-plan-form";
import { DeletePlanButton } from "./_components/delete-plan-button";
import type { MealPlan, Patient } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPlanData(id: string): Promise<{
  plan: MealPlan;
  patient: Patient | null;
  patients: Patient[];
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch the plan with patient info
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*, patients (*)")
    .eq("id", id)
    .eq("nutri_id", user.id)
    .single();

  if (!plan) {
    return null;
  }

  // Fetch all patients for the dropdown
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("nutri_id", user.id)
    .order("full_name", { ascending: true });

  return {
    plan: plan as unknown as MealPlan,
    patient: plan.patients as Patient | null,
    patients: (patients ?? []) as Patient[],
  };
}

export default async function PlanSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getPlanData(id);

  if (!result) {
    notFound();
  }

  const { plan, patient, patients } = result;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/plans/${id}/edit`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Configurações do Plano
          </h1>
          <p className="text-muted-foreground">
            {plan.title || "Plano sem título"} • {patient?.full_name ?? "N/A"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Plano</CardTitle>
          <CardDescription>
            Atualize as informações básicas do plano alimentar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealPlanForm
            patients={patients}
            planId={id}
            initialData={plan}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis. Tenha cuidado ao usar essas opções.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Excluir Plano</p>
              <p className="text-sm text-muted-foreground">
                Exclui permanentemente o plano e todas as suas refeições.
              </p>
            </div>
            <DeletePlanButton planId={id} planTitle={plan.title} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
