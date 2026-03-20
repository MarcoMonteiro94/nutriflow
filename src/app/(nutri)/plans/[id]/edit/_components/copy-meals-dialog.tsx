"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Loader2, UtensilsCrossed } from "lucide-react";

interface Plan {
  id: string;
  title: string | null;
  patients: { full_name: string } | null;
}

interface MealPreview {
  id: string;
  title: string;
  time: string;
  foodCount: number;
}

interface CopyMealsDialogProps {
  currentPlanId: string;
  children: React.ReactNode;
}

export function CopyMealsDialog({ currentPlanId, children }: CopyMealsDialogProps) {
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealPreview[]>([]);
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function fetchPlans() {
      const supabase = createClient();
      const { data } = await supabase
        .from("meal_plans")
        .select("id, title, patients(full_name)")
        .neq("id", currentPlanId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      setPlans((data ?? []) as Plan[]);
      setIsLoadingPlans(false);
    }

    fetchPlans();

    return () => { cancelled = true; };
  }, [open, currentPlanId]);

  function handleSelectPlan(planId: string) {
    setSelectedPlanId(planId);
    setSelectedMealIds(new Set());
    setIsLoadingMeals(true);

    const supabase = createClient();
    supabase
      .from("meals")
      .select("id, title, time, meal_contents(id)")
      .eq("meal_plan_id", planId)
      .order("time", { ascending: true })
      .then(({ data }) => {
        const mealsData = (data ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          time: m.time,
          foodCount: (m.meal_contents as { id: string }[])?.length ?? 0,
        }));
        setMeals(mealsData);
        setSelectedMealIds(new Set(mealsData.map((m) => m.id)));
        setIsLoadingMeals(false);
      });
  }

  function toggleMeal(mealId: string) {
    setSelectedMealIds((prev) => {
      const next = new Set(prev);
      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }
      return next;
    });
  }

  function handleCopy() {
    if (selectedMealIds.size === 0) return;

    startTransition(async () => {
      const supabase = createClient();

      for (const mealId of selectedMealIds) {
        // Fetch full meal data with contents
        const { data: mealData } = await supabase
          .from("meals")
          .select("title, time, sort_order, meal_contents(id, food_id, amount, is_substitution, parent_content_id)")
          .eq("id", mealId)
          .single();

        if (!mealData) continue;

        // Create new meal in target plan
        const { data: newMeal } = await supabase
          .from("meals")
          .insert({
            meal_plan_id: currentPlanId,
            title: mealData.title,
            time: mealData.time,
            sort_order: mealData.sort_order,
          })
          .select("id")
          .single();

        if (!newMeal) continue;

        type ContentRow = { id: string; food_id: string; amount: number; is_substitution: boolean; parent_content_id: string | null };
        const contents = (mealData.meal_contents ?? []) as ContentRow[];

        // Insert main foods first, build old→new ID map
        const mainFoods = contents.filter((c) => !c.is_substitution);
        const idMap = new Map<string, string>();

        for (const food of mainFoods) {
          const { data: newContent } = await supabase
            .from("meal_contents")
            .insert({
              meal_id: newMeal.id,
              food_id: food.food_id,
              amount: food.amount,
              is_substitution: false,
            })
            .select("id")
            .single();

          if (newContent) {
            idMap.set(food.id, newContent.id);
          }
        }

        // Insert substitutions with mapped parent_content_id
        const substitutions = contents.filter((c) => c.is_substitution && c.parent_content_id);
        for (const sub of substitutions) {
          const newParentId = idMap.get(sub.parent_content_id!);
          if (!newParentId) continue;

          await supabase
            .from("meal_contents")
            .insert({
              meal_id: newMeal.id,
              food_id: sub.food_id,
              amount: sub.amount,
              is_substitution: true,
              parent_content_id: newParentId,
            });
        }
      }

      router.refresh();
      setOpen(false);
      setSelectedPlanId(null);
      setMeals([]);
      setSelectedMealIds(new Set());
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Copiar Refeições</DialogTitle>
          <DialogDescription>
            Selecione um plano e escolha quais refeições copiar.
          </DialogDescription>
        </DialogHeader>

        {!selectedPlanId ? (
          <div className="space-y-2 py-2">
            {isLoadingPlans ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhum outro plano encontrado.
              </div>
            ) : (
              plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className="w-full text-left p-3 rounded-xl border hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-sm">{plan.title || "Plano sem título"}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.patients?.full_name ?? "Sem paciente"}
                  </p>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPlanId(null);
                setMeals([]);
                setSelectedMealIds(new Set());
              }}
            >
              &larr; Voltar
            </Button>

            {isLoadingMeals ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : meals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Este plano não tem refeições.
              </p>
            ) : (
              <div className="space-y-2">
                {meals.map((meal) => (
                  <label
                    key={meal.id}
                    className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedMealIds.has(meal.id)}
                      onCheckedChange={() => toggleMeal(meal.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{meal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {meal.time.slice(0, 5)} &bull; {meal.foodCount} alimento{meal.foodCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          {selectedPlanId && (
            <Button
              onClick={handleCopy}
              disabled={isPending || selectedMealIds.size === 0}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copiar {selectedMealIds.size} refeição{selectedMealIds.size !== 1 ? "ões" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
