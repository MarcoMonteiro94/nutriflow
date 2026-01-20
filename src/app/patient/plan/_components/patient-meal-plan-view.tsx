"use client";

import { useState } from "react";
import { Clock, ChevronDown, ChevronUp, RefreshCw, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface Substitution {
  id: string;
  name: string;
  amount: number;
  calories: number;
}

interface Food {
  id: string;
  name: string;
  amount: number;
  calories: number;
  substitutions: Substitution[];
}

interface Meal {
  id: string;
  title: string;
  time: string;
  foods: Food[];
}

interface PatientMealPlanViewProps {
  planTitle: string;
  meals: Meal[];
}

function MealCard({ meal }: { meal: Meal }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFoods, setExpandedFoods] = useState<Set<string>>(new Set());

  const toggleFood = (foodId: string) => {
    setExpandedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(foodId)) {
        next.delete(foodId);
      } else {
        next.add(foodId);
      }
      return next;
    });
  };

  const totalCalories = meal.foods.reduce((sum, food) => sum + food.calories, 0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header - Always visible */}
      <button
        className="w-full flex items-center justify-between p-4 text-left active:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{meal.title}</p>
            <p className="text-sm text-muted-foreground">
              {meal.time} • {totalCalories} kcal
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          {meal.foods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum alimento nesta refeição.
            </p>
          ) : (
            meal.foods.map((food) => {
              const hasSubstitutions = food.substitutions.length > 0;
              const isFoodExpanded = expandedFoods.has(food.id);

              return (
                <div
                  key={food.id}
                  className={cn(
                    "rounded-lg border bg-muted/30",
                    hasSubstitutions && "border-dashed border-primary/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between p-3",
                      hasSubstitutions && "cursor-pointer active:bg-muted/50"
                    )}
                    onClick={() => hasSubstitutions && toggleFood(food.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.amount}g • {food.calories} kcal
                      </p>
                    </div>
                    {hasSubstitutions && (
                      <div className="flex items-center gap-1 ml-2">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          {food.substitutions.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Substitutions */}
                  {hasSubstitutions && isFoodExpanded && (
                    <div className="border-t border-dashed px-3 pb-3 pt-2 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Substitutos
                      </p>
                      {food.substitutions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between rounded-md bg-background p-2"
                        >
                          <div>
                            <p className="text-sm">{sub.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {sub.amount}g • {sub.calories} kcal
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function PatientMealPlanView({ planTitle, meals }: PatientMealPlanViewProps) {
  const totalDailyCalories = meals.reduce(
    (sum, meal) => sum + meal.foods.reduce((mealSum, food) => mealSum + food.calories, 0),
    0
  );

  const totalSubstitutions = meals.reduce(
    (sum, meal) =>
      sum + meal.foods.filter((f) => f.substitutions.length > 0).length,
    0
  );

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-semibold">{planTitle}</h1>
        <p className="text-sm text-muted-foreground">
          {totalDailyCalories} kcal / dia
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold">{meals.length}</p>
          <p className="text-xs text-muted-foreground">Refeições</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold">{totalDailyCalories}</p>
          <p className="text-xs text-muted-foreground">Calorias</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold">{totalSubstitutions}</p>
          <p className="text-xs text-muted-foreground">Opções</p>
        </div>
      </div>

      {/* Meals Timeline */}
      {meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma refeição</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu nutricionista ainda não adicionou refeições ao plano.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      )}

      {/* Tip */}
      {totalSubstitutions > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="text-sm text-primary/80">
            💡 <span className="font-medium">Dica:</span> Toque em um alimento com
            o ícone <RefreshCw className="h-3 w-3 inline" /> para ver opções de
            substituição.
          </p>
        </div>
      )}
    </div>
  );
}
