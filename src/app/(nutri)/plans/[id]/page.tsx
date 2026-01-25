import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Share2, Calendar, User, UtensilsCrossed, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
          food_items:food_id (*)
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

function calculateTotalCalories(meals: MealWithContents[]): number {
  let total = 0;
  for (const meal of meals) {
    for (const content of meal.meal_contents) {
      if (content.food_items && !content.is_substitution) {
        const amount = Number(content.amount);
        const calories = Number(content.food_items.calories);
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
        total += (amount / 100) * value;
      }
    }
  }
  return Math.round(total);
}

function getMealCalories(meal: MealWithContents): number {
  let total = 0;
  for (const content of meal.meal_contents) {
    if (content.food_items && !content.is_substitution) {
      const amount = Number(content.amount);
      const calories = Number(content.food_items.calories);
      total += (amount / 100) * calories;
    }
  }
  return Math.round(total);
}

export default async function ViewPlanPage({ params }: PageProps) {
  const { id } = await params;
  const plan = await getMealPlan(id);

  if (!plan) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
              Visualização do plano alimentar
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href={`/plans/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Patient & Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <Link
                    href={`/patients/${plan.patients?.id}`}
                    className="hover:underline font-medium"
                  >
                    {plan.patients?.full_name ?? "N/A"}
                  </Link>
                </div>
              </div>
              {plan.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{plan.description}</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  plan.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {plan.status === "active" ? "Ativo" : "Arquivado"}
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
              </div>
            </CardContent>
          </Card>

          {/* Meals List */}
          <Card>
            <CardHeader>
              <CardTitle>Refeições</CardTitle>
              <CardDescription>
                {plan.meals.length} refeição{plan.meals.length !== 1 ? "ões" : ""} no plano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.meals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UtensilsCrossed className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma refeição adicionada ainda.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href={`/plans/${id}/edit`}>Adicionar refeições</Link>
                  </Button>
                </div>
              ) : (
                plan.meals.map((meal) => (
                  <div key={meal.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{meal.time.slice(0, 5)}</span>
                        <span className="text-lg font-semibold">{meal.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {getMealCalories(meal)} kcal
                      </span>
                    </div>
                    {meal.meal_contents.filter(c => !c.is_substitution).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Sem alimentos adicionados
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {meal.meal_contents
                          .filter(content => !content.is_substitution)
                          .map((content) => (
                            <li
                              key={content.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{content.food_items?.name ?? "Alimento"}</span>
                              <span className="text-muted-foreground">
                                {content.amount}g
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/plans/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Plano
                </Link>
              </Button>
              {plan.patients && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/patients/${plan.patients.id}`}>
                    <User className="mr-2 h-4 w-4" />
                    Ver Paciente
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
