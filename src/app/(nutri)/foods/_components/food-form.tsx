"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  "Cereais e derivados",
  "Verduras e legumes",
  "Frutas",
  "Gorduras e óleos",
  "Carnes e derivados",
  "Leite e derivados",
  "Leguminosas",
  "Açúcares e doces",
  "Bebidas",
  "Ovos",
  "Pescados",
  "Nozes e sementes",
  "Outros",
] as const;

const PORTION_UNITS = [
  { value: "g", label: "gramas (g)" },
  { value: "ml", label: "mililitros (ml)" },
  { value: "unidade", label: "unidade" },
  { value: "colher de sopa", label: "colher de sopa" },
  { value: "colher de chá", label: "colher de chá" },
  { value: "xícara", label: "xícara" },
  { value: "fatia", label: "fatia" },
] as const;

export function FoodForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [sodium, setSodium] = useState("");
  const [portionSize, setPortionSize] = useState("");
  const [portionUnit, setPortionUnit] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("O nome do alimento é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Você precisa estar logado.");
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("food_items")
        .insert({
          name: name.trim(),
          category: category || null,
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
          fiber: fiber ? Number(fiber) : null,
          sodium: sodium ? Number(sodium) : null,
          portion_size: portionSize ? Number(portionSize) : null,
          portion_unit: portionUnit || null,
          source: "custom" as const,
          creator_id: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      router.push("/foods");
      router.refresh();
    } catch (err) {
      console.error("Error creating food:", err);
      setError("Erro ao cadastrar alimento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome do alimento *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Arroz integral cozido"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Portion */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="portionSize">Porção</Label>
          <Input
            id="portionSize"
            type="number"
            min="0"
            step="any"
            value={portionSize}
            onChange={(e) => setPortionSize(e.target.value)}
            placeholder="Ex: 100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portionUnit">Unidade</Label>
          <Select value={portionUnit} onValueChange={setPortionUnit}>
            <SelectTrigger id="portionUnit">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {PORTION_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Macros */}
      <div>
        <h3 className="text-sm font-medium mb-3">Informações nutricionais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="calories">Calorias (kcal)</Label>
            <Input
              id="calories"
              type="number"
              min="0"
              step="any"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Proteínas (g)</Label>
            <Input
              id="protein"
              type="number"
              min="0"
              step="any"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Carboidratos (g)</Label>
            <Input
              id="carbs"
              type="number"
              min="0"
              step="any"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fat">Gorduras (g)</Label>
            <Input
              id="fat"
              type="number"
              min="0"
              step="any"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fiber">Fibras (g)</Label>
            <Input
              id="fiber"
              type="number"
              min="0"
              step="any"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sodium">Sódio (mg)</Label>
            <Input
              id="sodium"
              type="number"
              min="0"
              step="any"
              value={sodium}
              onChange={(e) => setSodium(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cadastrar Alimento
        </Button>
      </div>
    </form>
  );
}
