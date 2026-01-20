import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { revalidatePath } from "next/cache";
import { AddFoodFormClient } from "./_components/add-food-form";
import { RemoveFoodButton } from "./_components/remove-food-button";
import type { FoodItem, Meal, MealContent } from "@/types/database";

interface MealPageProps {
  params: Promise<{
    id: string;
    mealId: string;
  }>;
}

type MealWithContents = Meal & {
  meal_contents: (MealContent & {
    food_items: FoodItem | null;
  })[];
};

export default async function MealPage({ params }: MealPageProps) {
  const { id: planId, mealId } = await params;
  const supabase = await createClient();

  // Get meal with its contents
  const { data: mealData, error: mealError } = await supabase
    .from("meals")
    .select(`
      *,
      meal_contents (
        *,
        food_items:food_id (*)
      )
    `)
    .eq("id", mealId)
    .single();

  if (mealError || !mealData) {
    notFound();
  }

  const meal = mealData as MealWithContents;

  // Verify this meal belongs to the plan
  if (meal.meal_plan_id !== planId) {
    notFound();
  }

  // Get plan info for navigation
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("title")
    .eq("id", planId)
    .single();

  const mealContents = meal.meal_contents || [];

  // Calculate total macros for current meal
  const totalMacros = mealContents
    .filter((c) => !c.is_substitution)
    .reduce(
      (acc, content) => {
        if (content.food_items) {
          const factor = Number(content.amount) / 100;
          return {
            calories: acc.calories + Math.round(content.food_items.calories * factor),
            protein: acc.protein + content.food_items.protein * factor,
            carbs: acc.carbs + content.food_items.carbs * factor,
            fat: acc.fat + content.food_items.fat * factor,
          };
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  async function addFoodToMeal(foodId: string, amount: number) {
    "use server";

    const supabase = await createClient();

    const { error } = await supabase.from("meal_contents").insert({
      meal_id: mealId,
      food_id: foodId,
      amount,
      is_substitution: false,
    });

    if (error) {
      console.error("Error adding food:", error);
      throw new Error("Failed to add food to meal");
    }

    revalidatePath(`/plans/${planId}/meals/${mealId}`);
  }

  async function removeFoodFromMeal(contentId: string) {
    "use server";

    const supabase = await createClient();

    const { error } = await supabase
      .from("meal_contents")
      .delete()
      .eq("id", contentId);

    if (error) {
      console.error("Error removing food:", error);
      throw new Error("Failed to remove food from meal");
    }

    revalidatePath(`/plans/${planId}/meals/${mealId}`);
  }

  return (
    <div className="container max-w-4xl py-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/plans/${planId}/edit`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Plano
          </Link>
        </Button>

        <h1 className="text-2xl font-bold">{meal.title}</h1>
        <p className="text-muted-foreground">
          {plan?.title || "Plano Alimentar"} &bull; {meal.time.slice(0, 5)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Food Search */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Alimento</CardTitle>
            <CardDescription>
              Busque e adicione alimentos a esta refeição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddFoodFormClient addFoodToMeal={addFoodToMeal} />
          </CardContent>
        </Card>

        {/* Meal Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Refeição</CardTitle>
            <CardDescription>
              Valores nutricionais totais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{totalMacros.calories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(totalMacros.protein * 10) / 10}
                </p>
                <p className="text-xs text-muted-foreground">Proteína (g)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(totalMacros.carbs * 10) / 10}
                </p>
                <p className="text-xs text-muted-foreground">Carboidrato (g)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.round(totalMacros.fat * 10) / 10}
                </p>
                <p className="text-xs text-muted-foreground">Gordura (g)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal Contents List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Alimentos na Refeição</CardTitle>
          <CardDescription>
            {mealContents.filter((c) => !c.is_substitution).length} alimento(s) adicionado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mealContents.filter((c) => !c.is_substitution).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum alimento adicionado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {mealContents
                .filter((c) => !c.is_substitution)
                .map((content) => {
                  const food = content.food_items;
                  if (!food) return null;

                  const factor = Number(content.amount) / 100;
                  const macros = {
                    calories: Math.round(food.calories * factor),
                    protein: Math.round(food.protein * factor * 10) / 10,
                    carbs: Math.round(food.carbs * factor * 10) / 10,
                    fat: Math.round(food.fat * factor * 10) / 10,
                  };

                  return (
                    <div
                      key={content.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{food.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {content.amount}g &bull; {macros.calories} kcal &bull; P: {macros.protein}g &bull; C: {macros.carbs}g &bull; G: {macros.fat}g
                        </p>
                      </div>
                      <RemoveFoodButton
                        contentId={content.id}
                        removeFoodFromMeal={removeFoodFromMeal}
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
