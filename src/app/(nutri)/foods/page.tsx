import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { FoodItem } from "@/types/database";

interface SearchParams {
  q?: string;
}

async function getFoods(searchQuery?: string): Promise<FoodItem[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("food_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.ilike("name", `%${searchQuery}%`);
  }

  const { data } = await query;

  return (data ?? []) as FoodItem[];
}

export default async function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const foods = await getFoods(params.q);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alimentos</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de alimentos.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/foods/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Alimento
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <form className="flex-1" action="/foods" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar por nome..."
              defaultValue={params.q}
              className="pl-10"
            />
          </div>
        </form>
      </div>

      {/* Foods List - Inline for now, will be extracted to component in subtask-1-2 */}
      {foods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              {params.q ? "Nenhum alimento encontrado" : "Nenhum alimento cadastrado"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {params.q
                ? `Não encontramos alimentos com "${params.q}". Tente outro termo.`
                : "Comece cadastrando seu primeiro alimento personalizado."}
            </p>
            {!params.q && (
              <Button asChild className="mt-4">
                <Link href="/foods/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Alimento
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {foods.map((food) => (
            <Card key={food.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{food.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g
                    </p>
                  </div>
                  <Badge variant={food.source === "official" ? "secondary" : "outline"}>
                    {food.source === "official" ? "Oficial" : "Personalizado"}
                  </Badge>
                </div>
                {food.category && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Categoria: {food.category}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
