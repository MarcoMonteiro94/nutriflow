import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { MealTimeline } from "./_components/meal-timeline";
import { NutrientCalculator } from "../_components/nutrient-calculator";
import {
  calculateMealTotals,
  calculateTMB,
  calculateTDEE,
  calculateAge,
  mapGenderToSex,
  suggestMacroTargets,
  inferGoalFromText,
} from "@/lib/nutrition-calculations";
import type { ActivityLevel } from "@/lib/nutrition-calculations";
import type { MealPlan, Meal, MealContent, FoodItem, Patient } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

type MealWithContents = Meal & {
  meal_contents: (MealContent & {
    food_items: FoodItem | null;
  })[];
};

type MealPlanWithDetails = MealPlan & {
  patients: Patient | null;
  meals: MealWithContents[];
};

async function getMealPlan(id: string): Promise<MealPlanWithDetails | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("meal_plans")
    .select(`
      *,
      patients (*),
      meals (
        *,
        meal_contents (
          *,
          food_items:food_id (*)
        )
      )
    `)
    .eq("id", id)
    .eq("nutri_id", user.id)
    .single();

  if (!data) return null;

  const meals = (data.meals || []) as MealWithContents[];
  const sortedMeals = meals.sort((a, b) => a.time.localeCompare(b.time));

  return {
    ...(data as unknown as MealPlan),
    patients: data.patients as Patient | null,
    meals: sortedMeals,
  };
}

function computeSuggestedTargets(patient: Patient | null, latestWeight: number | null, latestHeight: number | null) {
  if (!patient) return null;
  const age = patient.birth_date ? calculateAge(patient.birth_date) : null;
  const sex = mapGenderToSex(patient.gender);
  if (!age || !sex || !latestWeight || !latestHeight) return null;

  const tmb = calculateTMB({ weight: latestWeight, height: latestHeight, age, sex });
  const activityLevel = (patient.activity_level as ActivityLevel) || "sedentary";
  const tdee = calculateTDEE(tmb, activityLevel);
  const goal = inferGoalFromText(patient.goal);
  return suggestMacroTargets(tdee, goal);
}

export default async function EditPlanPage({ params }: PageProps) {
  const { id } = await params;
  const plan = await getMealPlan(id);
  if (!plan) notFound();

  let latestWeight: number | null = null;
  let latestHeight: number | null = null;

  if (plan.patients?.id) {
    const supabase = await createClient();
    const { data: anthropometry } = await supabase
      .from("anthropometry_assessments")
      .select("weight, height")
      .eq("patient_id", plan.patients.id)
      .order("assessed_at", { ascending: false })
      .limit(1)
      .single();

    if (anthropometry) {
      latestWeight = anthropometry.weight ? Number(anthropometry.weight) : null;
      latestHeight = anthropometry.height ? Number(anthropometry.height) : null;
    }
  }

  const totals = calculateMealTotals(plan.meals);
  const suggestedTargets = computeSuggestedTargets(plan.patients, latestWeight, latestHeight);

  async function updateTargets(targets: Record<string, number | null>) {
    "use server";
    const supabase = await createClient();
    const { error } = await supabase
      .from("meal_plans")
      .update({
        target_calories: targets.calories ?? null,
        target_protein: targets.protein ?? null,
        target_carbs: targets.carbs ?? null,
        target_fat: targets.fat ?? null,
      })
      .eq("id", id);
    if (error) throw error;
    revalidatePath(`/plans/${id}/edit`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/plans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {plan.title || "Plano sem título"}
            </h1>
            <p className="text-muted-foreground">
              Paciente: {plan.patients?.full_name ?? "N/A"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/plans/${id}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Refeições</CardTitle>
              <CardDescription>
                Adicione e organize as refeições do plano alimentar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MealTimeline planId={id} initialMeals={plan.meals} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <NutrientCalculator
            targets={{
              calories: plan.target_calories ?? null,
              protein: plan.target_protein ?? null,
              carbs: plan.target_carbs ?? null,
              fat: plan.target_fat ?? null,
            }}
            totals={totals}
            suggestedTargets={suggestedTargets}
            onUpdateTargets={updateTargets}
            mealCount={plan.meals.length}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                plan.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {plan.status === "active" ? "Ativo" : "Arquivado"}
              </div>
              {plan.starts_at && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Início: {new Date(plan.starts_at).toLocaleDateString("pt-BR")}
                </p>
              )}
              {plan.ends_at && (
                <p className="text-sm text-muted-foreground">
                  Término: {new Date(plan.ends_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
