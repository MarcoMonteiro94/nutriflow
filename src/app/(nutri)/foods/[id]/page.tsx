import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Leaf,
  Utensils,
  Scale,
  Tag,
} from "lucide-react";
import type { FoodItem } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getFood(id: string): Promise<FoodItem | null> {
  const supabase = await createClient();

  const { data: food, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !food) {
    return null;
  }

  return food as FoodItem;
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export default async function FoodDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [food, currentUserId] = await Promise.all([
    getFood(id),
    getCurrentUserId(),
  ]);

  if (!food) {
    notFound();
  }

  // User can edit/delete only custom foods they created
  const canModify = food.source === "custom" && food.creator_id === currentUserId;

  // Format number for display (Brazilian format)
  const formatNumber = (value: number | null, decimals = 1): string => {
    if (value === null || value === undefined) return "0";
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Calculate values per portion
  const portionSize = food.portion_size ?? 100;
  const factor = portionSize / 100;

  const macros = {
    calories: Math.round(food.calories * factor),
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
    fiber: food.fiber ? food.fiber * factor : null,
    sodium: food.sodium ? food.sodium * factor : null,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/foods">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Detalhes do Alimento
            </h1>
            <p className="text-muted-foreground">
              Informações nutricionais completas.
            </p>
          </div>
        </div>
        {canModify && (
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1 sm:flex-none">
              <Link href={`/foods/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Food Info Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">{food.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {food.category && (
                    <>
                      <Tag className="h-4 w-4" />
                      {food.category}
                    </>
                  )}
                </CardDescription>
              </div>
              <Badge
                variant={food.source === "official" ? "secondary" : "outline"}
              >
                {food.source === "official" ? "Oficial" : "Personalizado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Portion Info */}
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tamanho da Porção</p>
                <p className="font-medium">
                  {portionSize}{food.portion_unit ?? "g"}
                </p>
              </div>
            </div>

            {/* Macros per 100g */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Valores por 100g
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex items-center gap-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Calorias</p>
                    <p className="font-semibold">{Math.round(food.calories)} kcal</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
                  <Beef className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Proteína</p>
                    <p className="font-semibold">{formatNumber(food.protein)}g</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                  <Wheat className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Carboidratos</p>
                    <p className="font-semibold">{formatNumber(food.carbs)}g</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 p-3">
                  <Droplets className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Gordura</p>
                    <p className="font-semibold">{formatNumber(food.fat)}g</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional nutrients */}
            {(food.fiber !== null || food.sodium !== null) && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Outros Nutrientes (por 100g)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {food.fiber !== null && (
                    <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/20 p-3">
                      <Leaf className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Fibra</p>
                        <p className="font-semibold">{formatNumber(food.fiber)}g</p>
                      </div>
                    </div>
                  )}
                  {food.sodium !== null && (
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-950/20 p-3">
                      <Utensils className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sódio</p>
                        <p className="font-semibold">{formatNumber(food.sodium)}mg</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per Portion Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Valores por Porção
              </CardTitle>
              <CardDescription>
                {portionSize}{food.portion_unit ?? "g"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Calorias</span>
                </div>
                <span className="font-semibold">{macros.calories} kcal</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Beef className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Proteína</span>
                </div>
                <span className="font-semibold">{formatNumber(macros.protein)}g</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Carboidratos</span>
                </div>
                <span className="font-semibold">{formatNumber(macros.carbs)}g</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Gordura</span>
                </div>
                <span className="font-semibold">{formatNumber(macros.fat)}g</span>
              </div>
              {macros.fiber !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Fibra</span>
                  </div>
                  <span className="font-semibold">{formatNumber(macros.fiber)}g</span>
                </div>
              )}
              {macros.sodium !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-slate-500" />
                    <span className="text-sm">Sódio</span>
                  </div>
                  <span className="font-semibold">{formatNumber(macros.sodium)}mg</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Source Info Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fonte</span>
                <Badge variant={food.source === "official" ? "secondary" : "outline"}>
                  {food.source === "official" ? "Tabela TACO" : "Personalizado"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cadastrado em</span>
                <span>
                  {new Date(food.created_at).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
