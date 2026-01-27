"use client";

import { useState } from "react";
import {
  ChevronDown,
  RefreshCw,
  UtensilsCrossed,
  Flame,
  Utensils,
  Sparkles,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function MealCard({ meal, index }: { meal: Meal; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First meal expanded by default
  const [expandedFoods, setExpandedFoods] = useState<Set<string>>(new Set());

  const toggleFood = (foodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
  const hasSubstitutions = meal.foods.some((f) => f.substitutions.length > 0);

  // Get time period for visual styling
  const hour = parseInt(meal.time.split(":")[0]);
  const getTimePeriod = () => {
    if (hour >= 5 && hour < 10) return { label: "Manhã", gradient: "from-amber-500/20 to-orange-500/20", icon: "☀️" };
    if (hour >= 10 && hour < 12) return { label: "Lanche", gradient: "from-yellow-500/20 to-amber-500/20", icon: "🥤" };
    if (hour >= 12 && hour < 15) return { label: "Almoço", gradient: "from-green-500/20 to-emerald-500/20", icon: "🍽️" };
    if (hour >= 15 && hour < 18) return { label: "Tarde", gradient: "from-blue-500/20 to-cyan-500/20", icon: "☕" };
    if (hour >= 18 && hour < 21) return { label: "Jantar", gradient: "from-purple-500/20 to-violet-500/20", icon: "🌙" };
    return { label: "Ceia", gradient: "from-indigo-500/20 to-purple-500/20", icon: "✨" };
  };

  const timePeriod = getTimePeriod();

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300",
        isExpanded && "ring-1 ring-primary/20 shadow-lg shadow-primary/5"
      )}
    >
      {/* Header */}
      <button
        className="w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn(
          "relative overflow-hidden transition-colors",
          isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
        )}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {/* Time badge */}
              <div className="flex flex-col items-center justify-center rounded-xl bg-background px-3 py-2 shadow-sm border">
                <span className="text-lg">{timePeriod.icon}</span>
                <span className="text-xs font-bold tabular-nums text-foreground">
                  {meal.time}
                </span>
              </div>

              <div>
                <p className="text-base font-semibold lg:text-lg">
                  {meal.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs font-medium">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {totalCalories} kcal
                  </Badge>
                  {hasSubstitutions && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <RefreshCw className="h-3 w-3" />
                      Opções
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-transform duration-300",
                isExpanded && "rotate-180"
              )}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-0 pb-4">
            {meal.foods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Utensils className="h-10 w-10 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum alimento nesta refeição.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {meal.foods.map((food, foodIndex) => {
                  const hasSubstitutions = food.substitutions.length > 0;
                  const isFoodExpanded = expandedFoods.has(food.id);

                  return (
                    <div
                      key={food.id}
                      className={cn(
                        "rounded-xl border bg-muted/30 transition-all duration-200",
                        hasSubstitutions && "border-primary/20 hover:border-primary/40",
                        isFoodExpanded && "ring-1 ring-primary/30 bg-primary/5"
                      )}
                      style={{
                        animationDelay: `${foodIndex * 50}ms`,
                      }}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-3 p-3",
                          hasSubstitutions && "cursor-pointer"
                        )}
                        onClick={(e) => hasSubstitutions && toggleFood(food.id, e)}
                      >
                        {/* Food indicator */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                          <span className="text-lg">🥗</span>
                        </div>

                        {/* Food info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate lg:text-base">
                            {food.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium tabular-nums">
                              {food.amount}g
                            </span>
                            <span>•</span>
                            <span className="tabular-nums">{food.calories} kcal</span>
                          </div>
                        </div>

                        {/* Substitution indicator */}
                        {hasSubstitutions && (
                          <div
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                              isFoodExpanded
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            <RefreshCw
                              className={cn(
                                "h-3 w-3 transition-transform duration-300",
                                isFoodExpanded && "rotate-180"
                              )}
                            />
                            <span className="hidden sm:inline">
                              {food.substitutions.length} opções
                            </span>
                            <span className="sm:hidden">{food.substitutions.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Substitutions */}
                      {hasSubstitutions && (
                        <div
                          className={cn(
                            "grid transition-all duration-200",
                            isFoodExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className="border-t border-dashed border-primary/20 px-3 pb-3 pt-3">
                              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Sparkles className="h-3 w-3 text-primary" />
                                Pode substituir por:
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {food.substitutions.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center gap-2 rounded-lg bg-background p-2.5 shadow-sm"
                                  >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm">
                                      🔄
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium">
                                        {sub.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground tabular-nums">
                                        {sub.amount}g • {sub.calories} kcal
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

export function PatientMealPlanView({ planTitle, meals }: PatientMealPlanViewProps) {
  const totalDailyCalories = meals.reduce(
    (sum, meal) =>
      sum + meal.foods.reduce((mealSum, food) => mealSum + food.calories, 0),
    0
  );

  const totalFoods = meals.reduce((sum, meal) => sum + meal.foods.length, 0);

  const totalSubstitutions = meals.reduce(
    (sum, meal) =>
      sum + meal.foods.reduce((fs, f) => fs + f.substitutions.length, 0),
    0
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-8 text-center lg:mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
          <UtensilsCrossed className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Seu Plano Alimentar</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          {planTitle}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Plano personalizado para seus objetivos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-3 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-4 text-center lg:p-6">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Flame className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums lg:text-3xl">
              {totalDailyCalories.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Calorias/dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center lg:p-6">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums lg:text-3xl">
              {meals.length}
            </p>
            <p className="text-xs text-muted-foreground lg:text-sm">Refeições</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center lg:p-6">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums lg:text-3xl">
              {totalSubstitutions}
            </p>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Substituições
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meals */}
      {meals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma refeição</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Seu nutricionista ainda não adicionou refeições ao seu plano.
              Entre em contato para mais informações.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: 2 columns, Mobile: 1 column */}
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            {meals.map((meal, index) => (
              <MealCard key={meal.id} meal={meal} index={index} />
            ))}
          </div>

          {/* Tip */}
          {totalSubstitutions > 0 && (
            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-3 p-4 lg:items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-primary/90">
                  <span className="font-medium">Dica:</span> Clique em um alimento
                  com o ícone{" "}
                  <RefreshCw className="inline h-3 w-3" /> para ver opções de
                  substituição. Você pode trocar por alimentos equivalentes quando
                  preferir variar o cardápio.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
