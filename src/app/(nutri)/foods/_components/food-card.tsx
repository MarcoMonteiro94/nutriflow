import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Beef, Wheat, Droplets, Tag } from "lucide-react";
import Link from "next/link";
import type { FoodItem } from "@/types/database";

interface FoodCardProps {
  food: FoodItem;
}

export function FoodCard({ food }: FoodCardProps) {
  // Calculate macros per portion (values are per 100g)
  const portionSize = food.portion_size ?? 100;
  const factor = portionSize / 100;

  const macros = {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
  };

  return (
    <Card className="hover:shadow-soft-lg transition-all">
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <Link
              href={`/foods/${food.id}`}
              className="block truncate font-semibold text-sm sm:text-base hover:underline"
            >
              {food.name}
            </Link>
            {food.category && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Tag className="h-3 w-3 shrink-0" />
                <span className="truncate">{food.category}</span>
              </div>
            )}
          </div>
          <Badge
            variant={food.source === "official" ? "secondary" : "outline"}
            className="shrink-0 text-[10px] sm:text-xs"
          >
            {food.source === "official" ? "Oficial" : "Customizado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
        {/* Macros Grid */}
        <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/50 p-2 sm:p-3">
          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            <span className="text-xs sm:text-sm font-semibold">{macros.calories}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">kcal</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <Beef className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            <span className="text-xs sm:text-sm font-semibold">{macros.protein}g</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">Prot</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <Wheat className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-semibold">{macros.carbs}g</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">Carb</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-semibold">{macros.fat}g</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">Gord</span>
          </div>
        </div>

        {/* Portion Info */}
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          Porção: {portionSize}{food.portion_unit ?? "g"}
        </p>

        {/* Action Button */}
        <Button asChild variant="outline" size="sm" className="w-full text-xs sm:text-sm">
          <Link href={`/foods/${food.id}`}>Ver detalhes</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
