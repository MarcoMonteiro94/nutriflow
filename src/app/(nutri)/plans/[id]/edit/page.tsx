import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MealTimeline } from "./_components/meal-timeline";
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

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("meal_plans")
    .select(`
      *,
      patients (*),
      meals (
        *,
        meal_contents (
          *,
          food_items (*)
        )
      )
    `)
    .eq("id", id)
    .eq("nutri_id", user.id)
    .single();

  if (!data) {
    return null;
  }

  // Sort meals by time
  const meals = (data.meals || []) as MealWithContents[];
  const sortedMeals = meals.sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  return {
    ...(data as unknown as MealPlan),
    patients: data.patients as Patient | null,
    meals: sortedMeals,
  };
}

export default async function EditPlanPage({ params }: PageProps) {
  const { id } = await params;
  const plan = await getMealPlan(id);

  if (!plan) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <Button asChild variant="outline">
          <Link href={`/plans/${id}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline Editor */}
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

        {/* Summary Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Diário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Calorias</p>
                  <p className="text-2xl font-bold">
                    {calculateTotalCalories(plan.meals)}
                  </p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Proteínas</p>
                  <p className="text-2xl font-bold">
                    {calculateTotalMacro(plan.meals, "protein")}
                  </p>
                  <p className="text-xs text-muted-foreground">g</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Carboidratos</p>
                  <p className="text-2xl font-bold">
                    {calculateTotalMacro(plan.meals, "carbs")}
                  </p>
                  <p className="text-xs text-muted-foreground">g</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Gorduras</p>
                  <p className="text-2xl font-bold">
                    {calculateTotalMacro(plan.meals, "fat")}
                  </p>
                  <p className="text-xs text-muted-foreground">g</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {plan.meals.length} refeição{plan.meals.length !== 1 ? "ões" : ""} no plano
                </p>
              </div>
            </CardContent>
          </Card>

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

function calculateTotalCalories(meals: MealWithContents[]): number {
  let total = 0;
  for (const meal of meals) {
    for (const content of meal.meal_contents) {
      if (content.food_items && !content.is_substitution) {
        const amount = Number(content.amount);
        const calories = Number(content.food_items.calories);
        // Values are per 100g
        total += (amount / 100) * calories;
      }
    }
  }
  return Math.round(total);
}

function calculateTotalMacro(meals: MealWithContents[], macro: "protein" | "carbs" | "fat"): number {
  let total = 0;
  for (const meal of meals) {
    for (const content of meal.meal_contents) {
      if (content.food_items && !content.is_substitution) {
        const amount = Number(content.amount);
        const value = Number(content.food_items[macro]);
        // Values are per 100g
        total += (amount / 100) * value;
      }
    }
  }
  return Math.round(total);
}
