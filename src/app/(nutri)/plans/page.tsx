import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PlansList } from "./_components/plans-list";
import type { MealPlan } from "@/types/database";

type MealPlanWithPatient = MealPlan & {
  patients: {
    id: string;
    full_name: string;
  } | null;
};

async function getMealPlans(): Promise<MealPlanWithPatient[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("meal_plans")
    .select(`
      *,
      patients (
        id,
        full_name
      )
    `)
    .eq("nutri_id", user.id)
    .order("updated_at", { ascending: false });

  return (data ?? []) as MealPlanWithPatient[];
}

export default async function PlansPage() {
  const mealPlans = await getMealPlans();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planos Alimentares</h1>
          <p className="text-muted-foreground">
            Gerencie os planos alimentares dos seus pacientes.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Link>
        </Button>
      </div>

      <PlansList mealPlans={mealPlans} />
    </div>
  );
}
