"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Plus, Repeat, Trash2, Loader2, Check, X, Pencil } from "lucide-react";
import type { FoodItem, MealContent } from "@/types/database";
import { SubstitutionSearch } from "./substitution-search";

type MealContentWithFood = MealContent & {
  food_items: FoodItem | null;
};

interface FoodItemCardProps {
  content: MealContentWithFood;
  substitutions: MealContentWithFood[];
  onRemove: (contentId: string) => Promise<void>;
  onAddSubstitution: (foodId: string, amount: number, parentContentId: string) => Promise<void>;
  onRemoveSubstitution: (contentId: string) => Promise<void>;
  onUpdateAmount: (contentId: string, amount: number) => Promise<void>;
}

function InlineAmountEditor({
  contentId,
  currentAmount,
  onSave,
  disabled,
}: {
  contentId: string;
  currentAmount: number;
  onSave: (contentId: string, amount: number) => void;
  disabled: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(String(currentAmount));

  function handleSave() {
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setEditAmount(String(currentAmount));
      setIsEditing(false);
      return;
    }
    onSave(contentId, parsed);
    setIsEditing(false);
  }

  function handleCancel() {
    setEditAmount(String(currentAmount));
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1">
        <Input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-6 w-16 px-1 text-sm text-center"
          min={1}
          step="any"
          autoFocus
          disabled={disabled}
        />
        <span className="text-sm">g</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-emerald-600 hover:text-emerald-700"
          onClick={handleSave}
          disabled={disabled}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground"
          onClick={handleCancel}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="inline-flex items-center gap-1 rounded px-1 -mx-1 hover:bg-muted/60 transition-colors group"
      title="Clique para editar gramatura"
    >
      <span>{currentAmount}g</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function FoodItemCard({
  content,
  substitutions,
  onRemove,
  onAddSubstitution,
  onRemoveSubstitution,
  onUpdateAmount,
}: FoodItemCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingSubstitution, setIsAddingSubstitution] = useState(false);
  const [isPending, startTransition] = useTransition();

  const food = content.food_items;
  if (!food) return null;

  const factor = Number(content.amount) / 100;
  const macros = {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
  };

  const handleRemove = () => {
    startTransition(async () => {
      await onRemove(content.id);
    });
  };

  const handleUpdateAmount = (contentId: string, amount: number) => {
    startTransition(async () => {
      await onUpdateAmount(contentId, amount);
    });
  };

  const handleAddSubstitution = (selectedFood: FoodItem, amount: number) => {
    startTransition(async () => {
      await onAddSubstitution(selectedFood.id, amount, content.id);
      setIsAddingSubstitution(false);
    });
  };

  const handleRemoveSubstitution = (substitutionId: string) => {
    startTransition(async () => {
      await onRemoveSubstitution(substitutionId);
    });
  };

  const handleUpdateSubstitutionAmount = (subContentId: string, amount: number) => {
    startTransition(async () => {
      await onUpdateAmount(subContentId, amount);
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border">
        {/* Main Food Item */}
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{food.name}</p>
              {substitutions.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                  <Repeat className="mr-1 h-3 w-3" />
                  {substitutions.length} substituição{substitutions.length !== 1 ? "ões" : ""}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              <InlineAmountEditor
                contentId={content.id}
                currentAmount={Number(content.amount)}
                onSave={handleUpdateAmount}
                disabled={isPending}
              />
              {" "}&bull; {macros.calories} kcal &bull; P: {macros.protein}g &bull; C: {macros.carbs}g &bull; G: {macros.fat}g
            </p>
          </div>
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Substitutions Section */}
        <CollapsibleContent>
          <div className="border-t bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Substituições</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingSubstitution(!isAddingSubstitution)}
              >
                {isAddingSubstitution ? (
                  "Cancelar"
                ) : (
                  <>
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>

            {/* Add Substitution Form */}
            {isAddingSubstitution && (
              <div className="rounded-lg border bg-background p-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Busque um alimento similar para substituição:
                </p>
                <SubstitutionSearch
                  originalFood={food}
                  originalAmount={content.amount}
                  onSelect={handleAddSubstitution}
                  disabled={isPending}
                />
              </div>
            )}

            {/* Existing Substitutions */}
            {substitutions.length === 0 && !isAddingSubstitution ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma substituição adicionada.
              </p>
            ) : (
              <div className="space-y-2">
                {substitutions.map((sub) => {
                  const subFood = sub.food_items;
                  if (!subFood) return null;

                  const subFactor = Number(sub.amount) / 100;
                  const subMacros = {
                    calories: Math.round(subFood.calories * subFactor),
                    protein: Math.round(subFood.protein * subFactor * 10) / 10,
                    carbs: Math.round(subFood.carbs * subFactor * 10) / 10,
                    fat: Math.round(subFood.fat * subFactor * 10) / 10,
                  };

                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg bg-background border p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Repeat className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm font-medium">{subFood.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground ml-5">
                          <InlineAmountEditor
                            contentId={sub.id}
                            currentAmount={Number(sub.amount)}
                            onSave={handleUpdateSubstitutionAmount}
                            disabled={isPending}
                          />
                          {" "}&bull; {subMacros.calories} kcal &bull; P: {subMacros.protein}g &bull; C: {subMacros.carbs}g &bull; G: {subMacros.fat}g
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveSubstitution(sub.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
