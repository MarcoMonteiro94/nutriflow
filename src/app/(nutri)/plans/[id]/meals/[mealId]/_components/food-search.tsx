"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodItem } from "@/types/database";

interface FoodSearchProps {
  onSelect: (food: FoodItem, amount: number) => void;
  disabled?: boolean;
}

interface MacroDisplay {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function FoodSearch({ onSelect, disabled }: FoodSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [amount, setAmount] = useState("100");
  const [macros, setMacros] = useState<MacroDisplay | null>(null);

  // Debounced search
  const searchFoods = useCallback(async (query: string) => {
    if (query.length < 2) {
      setFoods([]);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data } = await supabase
        .from("food_items")
        .select("*")
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .order("name")
        .limit(20);

      setFoods((data ?? []) as FoodItem[]);
    } catch (err) {
      console.error("Error searching foods:", err);
      setFoods([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchFoods]);

  // Calculate macros when food or amount changes
  useEffect(() => {
    if (selectedFood && amount) {
      const amountNum = parseFloat(amount) || 0;
      const factor = amountNum / 100;

      setMacros({
        calories: Math.round(selectedFood.calories * factor),
        protein: Math.round(selectedFood.protein * factor * 10) / 10,
        carbs: Math.round(selectedFood.carbs * factor * 10) / 10,
        fat: Math.round(selectedFood.fat * factor * 10) / 10,
      });
    } else {
      setMacros(null);
    }
  }, [selectedFood, amount]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setOpen(false);
  };

  const handleAdd = () => {
    if (selectedFood && amount) {
      onSelect(selectedFood, parseFloat(amount));
      setSelectedFood(null);
      setAmount("100");
      setSearchQuery("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Buscar Alimento</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedFood ? selectedFood.name : "Selecione um alimento..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  placeholder="Digite para buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <CommandList>
                <CommandEmpty>
                  {searchQuery.length < 2
                    ? "Digite pelo menos 2 caracteres..."
                    : "Nenhum alimento encontrado."}
                </CommandEmpty>
                <CommandGroup>
                  {foods.map((food) => (
                    <CommandItem
                      key={food.id}
                      value={food.id}
                      onSelect={() => handleSelectFood(food)}
                      className="flex flex-col items-start py-3"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-medium">{food.name}</span>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            selectedFood?.id === food.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{food.calories} kcal</span>
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>G: {food.fat}g</span>
                        <span className="text-muted-foreground/60">
                          (por 100g)
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedFood && (
        <>
          <div className="space-y-2">
            <Label htmlFor="amount">Quantidade (gramas)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
          </div>

          {macros && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">
                Valores para {amount}g de {selectedFood.name}:
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{macros.calories}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{macros.protein}</p>
                  <p className="text-xs text-muted-foreground">Proteína (g)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{macros.carbs}</p>
                  <p className="text-xs text-muted-foreground">Carboidrato (g)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{macros.fat}</p>
                  <p className="text-xs text-muted-foreground">Gordura (g)</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleAdd}
            disabled={!selectedFood || !amount || parseFloat(amount) <= 0}
            className="w-full"
          >
            Adicionar ao Plano
          </Button>
        </>
      )}
    </div>
  );
}
