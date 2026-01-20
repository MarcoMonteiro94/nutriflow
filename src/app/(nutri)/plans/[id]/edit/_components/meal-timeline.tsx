"use client";

import { useState, useCallback, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, Plus, ChevronDown, ChevronUp, Trash2, Loader2, UtensilsCrossed, Pencil } from "lucide-react";
import { SaveStatusIndicator } from "@/components/save-status-indicator";
import { useAutoSave } from "@/hooks/use-auto-save";
import type { Meal, MealContent, FoodItem } from "@/types/database";

type MealWithContents = Meal & {
  meal_contents: (MealContent & {
    food_items: FoodItem | null;
  })[];
};

interface MealTimelineProps {
  planId: string;
  initialMeals: MealWithContents[];
}

const MEAL_TYPES = [
  { value: "cafe", label: "Café da Manhã", time: "07:00" },
  { value: "lanche_manha", label: "Lanche da Manhã", time: "10:00" },
  { value: "almoco", label: "Almoço", time: "12:00" },
  { value: "lanche_tarde", label: "Lanche da Tarde", time: "15:00" },
  { value: "jantar", label: "Jantar", time: "19:00" },
  { value: "ceia", label: "Ceia", time: "21:00" },
  { value: "custom", label: "Personalizado", time: "12:00" },
];

type MealAction =
  | { type: "add"; meal: MealWithContents }
  | { type: "delete"; mealId: string }
  | { type: "update"; mealId: string; updates: Partial<Meal> };

export function MealTimeline({ planId, initialMeals }: MealTimelineProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Optimistic state for immediate UI updates
  const [optimisticMeals, updateOptimisticMeals] = useOptimistic(
    initialMeals,
    (state: MealWithContents[], action: MealAction) => {
      switch (action.type) {
        case "add":
          return [...state, action.meal].sort((a, b) => a.time.localeCompare(b.time));
        case "delete":
          return state.filter((m) => m.id !== action.mealId);
        case "update":
          return state.map((m) =>
            m.id === action.mealId ? { ...m, ...action.updates } : m
          ).sort((a, b) => a.time.localeCompare(b.time));
        default:
          return state;
      }
    }
  );

  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [newMealType, setNewMealType] = useState("cafe");
  const [newMealTitle, setNewMealTitle] = useState("");
  const [newMealTime, setNewMealTime] = useState("07:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(
    new Set(initialMeals.map((m) => m.id))
  );
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingMealData, setEditingMealData] = useState<{ title: string; time: string } | null>(null);

  // Auto-save for meal edits
  const saveMealUpdate = useCallback(async (data: { mealId: string; title: string; time: string } | null) => {
    if (!data) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("meals")
      .update({ title: data.title, time: data.time })
      .eq("id", data.mealId);

    if (error) throw error;
  }, []);

  const { status: saveStatus, error: saveError } = useAutoSave({
    data: editingMealData && editingMealId ? { mealId: editingMealId, ...editingMealData } : null,
    onSave: async (data) => {
      if (data) {
        await saveMealUpdate(data);
        router.refresh();
      }
    },
    debounceMs: 800,
    enabled: !!editingMealData && !!editingMealId,
  });

  const handleMealTypeChange = (value: string) => {
    setNewMealType(value);
    const mealType = MEAL_TYPES.find((t) => t.value === value);
    if (mealType) {
      setNewMealTitle(mealType.label);
      setNewMealTime(mealType.time);
    }
  };

  const addMeal = async () => {
    setIsSubmitting(true);

    const tempId = `temp-${Date.now()}`;
    const newMeal: MealWithContents = {
      id: tempId,
      meal_plan_id: planId,
      title: newMealTitle || MEAL_TYPES.find((t) => t.value === newMealType)?.label || "Refeição",
      time: newMealTime,
      notes: null,
      sort_order: optimisticMeals.length,
      created_at: new Date().toISOString(),
      meal_contents: [],
    };

    startTransition(async () => {
      updateOptimisticMeals({ type: "add", meal: newMeal });

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("meals")
          .insert({
            meal_plan_id: planId,
            title: newMeal.title,
            time: newMealTime,
            sort_order: optimisticMeals.length,
          })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error("Failed to create meal");

        const createdMeal = data as Meal;
        setExpandedMeals((prev) => new Set([...prev, createdMeal.id]));
        setIsAddingMeal(false);
        setNewMealTitle("");
        setNewMealType("cafe");
        setNewMealTime("07:00");
        router.refresh();
      } catch (err) {
        console.error("Error adding meal:", err);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const deleteMeal = async (mealId: string) => {
    startTransition(async () => {
      updateOptimisticMeals({ type: "delete", mealId });

      try {
        const supabase = createClient();
        const { error } = await supabase.from("meals").delete().eq("id", mealId);

        if (error) throw error;
        router.refresh();
      } catch (err) {
        console.error("Error deleting meal:", err);
      }
    });
  };

  const startEditingMeal = (meal: MealWithContents) => {
    setEditingMealId(meal.id);
    setEditingMealData({ title: meal.title, time: meal.time });
  };

  const handleMealTitleChange = (mealId: string, title: string) => {
    setEditingMealData((prev) => prev ? { ...prev, title } : null);
    startTransition(() => {
      updateOptimisticMeals({ type: "update", mealId, updates: { title } });
    });
  };

  const handleMealTimeChange = (mealId: string, time: string) => {
    setEditingMealData((prev) => prev ? { ...prev, time } : null);
    startTransition(() => {
      updateOptimisticMeals({ type: "update", mealId, updates: { time } });
    });
  };

  const stopEditingMeal = () => {
    setEditingMealId(null);
    setEditingMealData(null);
  };

  const toggleMealExpanded = (mealId: string) => {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }
      return next;
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const calculateMealCalories = (meal: MealWithContents): number => {
    let total = 0;
    for (const content of meal.meal_contents) {
      if (content.food_items && !content.is_substitution) {
        const amount = Number(content.amount);
        const calories = Number(content.food_items.calories);
        total += (amount / 100) * calories;
      }
    }
    return Math.round(total);
  };

  return (
    <div className="space-y-4">
      {/* Save Status Indicator */}
      <div className="flex justify-end">
        <SaveStatusIndicator status={saveStatus} error={saveError} />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        {optimisticMeals.length > 0 && (
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted" />
        )}

        {optimisticMeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma refeição</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Adicione a primeira refeição ao plano.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {optimisticMeals.map((meal) => {
              const isExpanded = expandedMeals.has(meal.id);
              const mealCalories = calculateMealCalories(meal);
              const isEditing = editingMealId === meal.id;

              return (
                <div key={meal.id} className="relative flex gap-4">
                  {/* Time marker */}
                  <div className="flex flex-col items-center">
                    <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                      {formatTime(meal.time)}
                    </div>
                  </div>

                  {/* Meal card */}
                  <div className="flex-1 rounded-lg border bg-card">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => !isEditing && toggleMealExpanded(meal.id)}
                    >
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingMealData?.title ?? meal.title}
                              onChange={(e) => handleMealTitleChange(meal.id, e.target.value)}
                              className="h-8 font-medium"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={editingMealData?.time ?? meal.time}
                                onChange={(e) => handleMealTimeChange(meal.id, e.target.value)}
                                className="h-8 w-28"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={stopEditingMeal}
                              >
                                Fechar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-medium">{meal.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {meal.meal_contents.filter((c) => !c.is_substitution).length} alimento
                              {meal.meal_contents.filter((c) => !c.is_substitution).length !== 1 ? "s" : ""}
                              {mealCalories > 0 && ` • ${mealCalories} kcal`}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingMeal(meal);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMeal(meal.id);
                          }}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {!isEditing && (
                          isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>

                    {isExpanded && !isEditing && (
                      <div className="border-t p-4 space-y-3">
                        {meal.meal_contents.filter((c) => !c.is_substitution).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum alimento adicionado.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {meal.meal_contents
                              .filter((c) => !c.is_substitution)
                              .map((content) => (
                                <li
                                  key={content.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span>{content.food_items?.name ?? "Alimento"}</span>
                                  <span className="text-muted-foreground">{content.amount}g</span>
                                </li>
                              ))}
                          </ul>
                        )}
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <a href={`/plans/${planId}/meals/${meal.id}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Alimento
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Meal Button */}
      <Dialog open={isAddingMeal} onOpenChange={setIsAddingMeal}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Refeição
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Refeição</DialogTitle>
            <DialogDescription>
              Adicione uma nova refeição ao plano alimentar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Refeição</Label>
              <Select value={newMealType} onValueChange={handleMealTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newMealType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="mealTitle">Nome da Refeição</Label>
                <Input
                  id="mealTitle"
                  value={newMealTitle}
                  onChange={(e) => setNewMealTitle(e.target.value)}
                  placeholder="Ex: Pré-treino"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mealTime">Horário</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="mealTime"
                  type="time"
                  value={newMealTime}
                  onChange={(e) => setNewMealTime(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMeal(false)}>
              Cancelar
            </Button>
            <Button onClick={addMeal} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
