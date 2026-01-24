"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { PageTransition, StaggerList, StaggerItem, FadeIn } from "@/components/motion";
import { FoodCard } from "./food-card";
import type { FoodItem } from "@/types/database";

interface FoodsListProps {
  foods: FoodItem[];
  searchQuery?: string;
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
                  : "Comece cadastrando seu primeiro alimento personalizado para usar em seus planos alimentares."}
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
