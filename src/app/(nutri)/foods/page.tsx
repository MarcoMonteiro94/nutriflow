import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FoodsList } from "./_components/foods-list";
import { CategoryFilter } from "./_components/category-filter";
import type { FoodItem } from "@/types/database";

interface SearchParams {
  q?: string;
  category?: string;
}

// Categories from TACO (tabela brasileira de composição de alimentos)
const FOOD_CATEGORIES = [
  "Cereais e derivados",
  "Verduras e hortaliças",
  "Frutas e derivados",
  "Gorduras e óleos",
  "Pescados e frutos do mar",
  "Carnes e derivados",
  "Leite e derivados",
  "Leguminosas e derivados",
  "Nozes e sementes",
  "Ovos e derivados",
  "Bebidas",
];

async function getFoods(searchQuery?: string, category?: string): Promise<FoodItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("food_items")
    .select("*")
    .order("name", { ascending: true });

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
  }

  if (category) {
    query = query.eq("category", category);
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
  const foods = await getFoods(params.q, params.category);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alimentos</h1>
          <p className="text-muted-foreground">
            Gerencie os alimentos disponíveis para seus planos alimentares.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/foods/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Alimento
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <form className="flex-1" action="/foods" method="GET">
          {/* Preserve category when searching */}
          {params.category && (
            <input type="hidden" name="category" value={params.category} />
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar por nome ou categoria..."
              defaultValue={params.q}
              className="pl-10"
            />
          </div>
        </form>

        {/* Category Filter */}
        <CategoryFilter
          categories={FOOD_CATEGORIES}
          currentCategory={params.category}
        />
      </div>

      <FoodsList foods={foods} searchQuery={params.q} />
    </div>
  );
}
