"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UtensilsCrossed, Flame, Beef, Wheat, Droplets } from "lucide-react";
import Link from "next/link";
import { PageTransition, StaggerList, StaggerItem, FadeIn, MotionCard } from "@/components/motion";
import type { FoodItem } from "@/types/database";

interface FoodsListProps {
  foods: FoodItem[];
  searchQuery?: string;
}

function FoodCard({ food }: { food: FoodItem }) {
  return (
    <MotionCard className="hover:border-primary/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{food.name}</h3>
            {food.category && (
              <p className="text-sm text-muted-foreground">{food.category}</p>
            )}
          </div>
          {food.source === "custom" && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
              Personalizado
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{food.calories} kcal</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Beef className="h-4 w-4 text-red-500" />
            <span>{food.protein}g prot</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wheat className="h-4 w-4 text-amber-500" />
            <span>{food.carbs}g carb</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="h-4 w-4 text-yellow-500" />
            <span>{food.fat}g gord</span>
          </div>
        </div>

        {food.portion_size && food.portion_unit && (
          <p className="text-xs text-muted-foreground">
            Porção: {food.portion_size} {food.portion_unit}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/foods/${food.id}`}>Ver Detalhes</Link>
          </Button>
        </div>
      </CardContent>
    </MotionCard>
  );
}

export function FoodsList({ foods, searchQuery }: FoodsListProps) {
  return (
    <PageTransition className="space-y-6">
      {/* Food List */}
      {foods.length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchQuery ? "Nenhum alimento encontrado" : "Nenhum alimento cadastrado"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                {searchQuery
                  ? `Não encontramos alimentos com "${searchQuery}". Tente outro termo.`
                  : "Comece cadastrando seu primeiro alimento para criar planos alimentares."}
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4">
                  <Link href="/foods/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Alimento
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerList className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {foods.map((food) => (
            <StaggerItem key={food.id}>
              <FoodCard food={food} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
