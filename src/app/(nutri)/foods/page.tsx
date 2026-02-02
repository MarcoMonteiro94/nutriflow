import { redirect } from "next/navigation";
import { Apple } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isClinicalRole } from "@/lib/auth/authorization";
import { FoodsList } from "./_components/foods-list";
import type { FoodItem } from "@/types/database";

interface SearchParams {
  q?: string;
}

async function getFoods(searchQuery?: string): Promise<FoodItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const userRole = await getUserRole();
  if (!userRole || !isClinicalRole(userRole.role)) {
    redirect("/schedule");
  }

  const params = await searchParams;
  const foods = await getFoods(params.q);

  const totalFoods = foods.length;
  const customFoods = foods.filter((f) => f.source === "custom").length;
  const officialFoods = foods.filter((f) => f.source === "official").length;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-card via-card to-primary/[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/[0.03] to-transparent blur-3xl" />

        <div className="relative px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
                <Apple className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Base de Alimentos
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                  Gerencie os alimentos disponíveis para criar planos alimentares
                  personalizados para seus pacientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="max-w-6xl mx-auto">
          <FoodsList
            foods={foods}
            searchQuery={params.q}
            stats={{ total: totalFoods, custom: customFoods, official: officialFoods }}
          />
        </div>
      </div>
    </div>
  );
}
