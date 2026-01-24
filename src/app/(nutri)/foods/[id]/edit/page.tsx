import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { FoodForm } from "../../_components/food-form";
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

async function canUserEditFood(food: FoodItem): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // User can only edit custom foods they created
  return food.source === "custom" && food.creator_id === user?.id;
}

export default async function EditFoodPage({ params }: PageProps) {
  const { id } = await params;
  const food = await getFood(id);

  if (!food) {
    notFound();
  }

  const canEdit = await canUserEditFood(food);

  if (!canEdit) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/foods/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Alimento
          </h1>
          <p className="text-muted-foreground">
            Atualize as informações de {food.name}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Alimento</CardTitle>
          <CardDescription>
            Atualize os dados do alimento. Campos com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FoodForm food={food} />
        </CardContent>
      </Card>
    </div>
  );
}
