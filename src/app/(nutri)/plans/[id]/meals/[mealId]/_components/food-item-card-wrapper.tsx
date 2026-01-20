"use client";

import { FoodItemCard } from "./food-item-card";
import type { FoodItem, MealContent } from "@/types/database";

type MealContentWithFood = MealContent & {
  food_items: FoodItem | null;
};

interface FoodItemCardWrapperProps {
  content: MealContentWithFood;
  substitutions: MealContentWithFood[];
  onRemove: (contentId: string) => Promise<void>;
  onAddSubstitution: (foodId: string, amount: number, parentContentId: string) => Promise<void>;
  onRemoveSubstitution: (contentId: string) => Promise<void>;
}

export function FoodItemCardWrapper({
  content,
  substitutions,
  onRemove,
  onAddSubstitution,
  onRemoveSubstitution,
}: FoodItemCardWrapperProps) {
  return (
    <FoodItemCard
      content={content}
      substitutions={substitutions}
      onRemove={onRemove}
      onAddSubstitution={onAddSubstitution}
      onRemoveSubstitution={onRemoveSubstitution}
    />
  );
}
