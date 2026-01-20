"use client";

import { useTransition } from "react";
import { FoodSearch } from "./food-search";
import type { FoodItem } from "@/types/database";

interface AddFoodFormClientProps {
  addFoodToMeal: (foodId: string, amount: number) => Promise<void>;
}

export function AddFoodFormClient({ addFoodToMeal }: AddFoodFormClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleSelect = (food: FoodItem, amount: number) => {
    startTransition(async () => {
      await addFoodToMeal(food.id, amount);
    });
  };

  return <FoodSearch onSelect={handleSelect} disabled={isPending} />;
}
