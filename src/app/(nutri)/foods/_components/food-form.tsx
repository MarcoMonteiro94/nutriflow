"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { FoodItem } from "@/types/database";

// Categories from TACO table
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
] as const;

interface FoodFormProps {
  food?: FoodItem;
}

export function FoodForm({ food }: FoodFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!food;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Você precisa estar logado para cadastrar alimentos.");
      setIsLoading(false);
      return;
    }

    const foodData = {
      name: formData.get("name") as string,
      category: (formData.get("category") as string) || null,
      calories: parseFloat(formData.get("calories") as string) || 0,
      protein: parseFloat(formData.get("protein") as string) || 0,
      carbs: parseFloat(formData.get("carbs") as string) || 0,
      fat: parseFloat(formData.get("fat") as string) || 0,
      fiber: parseFloat(formData.get("fiber") as string) || null,
      sodium: parseFloat(formData.get("sodium") as string) || null,
      portion_size: parseFloat(formData.get("portion_size") as string) || 100,
      portion_unit: (formData.get("portion_unit") as string) || "g",
    };

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("food_items")
        .update(foodData)
        .eq("id", food.id);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      router.push(`/foods/${food.id}`);
    } else {
      const { data, error: insertError } = await supabase
        .from("food_items")
        .insert({
          ...foodData,
          source: "custom" as const,
          creator_id: user.id,
        })
        .select("id")
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? "Erro ao criar alimento");
        setIsLoading(false);
        return;
      }

      router.push(`/foods/${data.id}`);
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Nome do alimento */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nome do Alimento *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={food?.name}
            placeholder="Ex: Frango grelhado"
          />
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <select
            id="category"
            name="category"
            defaultValue={food?.category ?? ""}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <option value="">Selecione uma categoria...</option>
            {FOOD_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Porção */}
        <div className="space-y-2">
          <Label htmlFor="portion_size">Tamanho da Porção</Label>
          <div className="flex gap-2">
            <Input
              id="portion_size"
              name="portion_size"
              type="number"
              step="0.01"
              min="0"
              defaultValue={food?.portion_size ?? 100}
              placeholder="100"
              className="flex-1"
            />
            <select
              id="portion_unit"
              name="portion_unit"
              defaultValue={food?.portion_unit ?? "g"}
              className="flex h-10 w-24 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="unidade">unidade</option>
              <option value="fatia">fatia</option>
              <option value="colher">colher</option>
              <option value="xícara">xícara</option>
            </select>
          </div>
        </div>

        {/* Seção de macronutrientes */}
        <div className="sm:col-span-2">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Informações Nutricionais (por porção)
          </h3>
        </div>

        {/* Calorias */}
        <div className="space-y-2">
          <Label htmlFor="calories">Calorias (kcal)</Label>
          <Input
            id="calories"
            name="calories"
            type="number"
            step="0.01"
            min="0"
            defaultValue={food?.calories ?? ""}
            placeholder="0"
          />
        </div>

        {/* Proteína */}
        <div className="space-y-2">
          <Label htmlFor="protein">Proteína (g)</Label>
          <Input
            id="protein"
            name="protein"
            type="number"
            step="0.01"
            min="0"
            defaultValue={food?.protein ?? ""}
            placeholder="0"
          />
        </div>

        {/* Carboidratos */}
        <div className="space-y-2">
          <Label htmlFor="carbs">Carboidratos (g)</Label>
          <Input
            id="carbs"
            name="carbs"
            type="number"
            step="0.01"
            min="0"
            defaultValue={food?.carbs ?? ""}
            placeholder="0"
          />
        </div>

        {/* Gordura */}
        <div className="space-y-2">
          <Label htmlFor="fat">Gordura (g)</Label>
          <Input
            id="fat"
            name="fat"
            type="number"
            step="0.01"
            min="0"
            defaultValue={food?.fat ?? ""}
            placeholder="0"
          />
        </div>

        {/* Fibra */}
        <div className="space-y-2">
          <Label htmlFor="fiber">Fibra (g)</Label>
          <Input
            id="fiber"
            name="fiber"
            type="number"
            step="0.01"
            min="0"
            defaultValue={food?.fiber ?? ""}
            placeholder="0"
          />
        </div>

        {/* Sódio */}
        <div className="space-y-2">
          <Label htmlFor="sodium">Sódio (mg)</Label>
          <Input
            id="sodium"
            name="sodium"
            type="number"
            step="0.01"
            min="0"
            defaultValue={food?.sodium ?? ""}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Salvando..."
            : isEditing
            ? "Salvar Alterações"
            : "Cadastrar Alimento"}
        </Button>
      </div>
    </form>
  );
}
