"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Check, ChevronsUpDown, Loader2, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodItem } from "@/types/database";

interface SubstitutionSearchProps {
  originalFood: FoodItem;
  originalAmount: number;
  onSelect: (food: FoodItem, amount: number) => void;
  disabled?: boolean;
}

interface MacroDisplay {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function SubstitutionSearch({
  originalFood,
  originalAmount,
  onSelect,
  disabled,
}: SubstitutionSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [amount, setAmount] = useState(String(originalAmount));
  const [macros, setMacros] = useState<MacroDisplay | null>(null);

  // Load similar food suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!originalFood.category) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const supabase = createClient();

        // Find foods in the same category with similar macros
        const { data } = await supabase
          .from("food_items")
          .select("*")
          .eq("category", originalFood.category)
          .neq("id", originalFood.id)
          .order("name")
          .limit(5);

        setSuggestions((data ?? []) as FoodItem[]);
      } catch (err) {
        console.error("Error loading suggestions:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, [originalFood.id, originalFood.category]);

  // Debounced search
  const searchFoods = useCallback(
    async (query: string) => {
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
          .neq("id", originalFood.id)
          .order("name")
          .limit(20);

        setFoods((data ?? []) as FoodItem[]);
      } catch (err) {
        console.error("Error searching foods:", err);
        setFoods([]);
      } finally {
        setIsLoading(false);
      }
    },
    [originalFood.id]
  );

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
    // Calculate suggested amount based on caloric equivalence
    const originalCalories = (originalAmount / 100) * originalFood.calories;
    if (food.calories > 0) {
      const equivalentAmount = Math.round((originalCalories * 100) / food.calories);
      setAmount(String(equivalentAmount));
    }
  };

  const handleAdd = () => {
    if (selectedFood && amount) {
      onSelect(selectedFood, parseFloat(amount));
    }
  };

  // Calculate original macros for comparison
  const originalFactor = originalAmount / 100;
  const originalMacros = {
    calories: Math.round(originalFood.calories * originalFactor),
    protein: Math.round(originalFood.protein * originalFactor * 10) / 10,
    carbs: Math.round(originalFood.carbs * originalFactor * 10) / 10,
    fat: Math.round(originalFood.fat * originalFactor * 10) / 10,
  };

  return (
    <div className="space-y-4">
      {/* Suggestions */}
      {!selectedFood && suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Sugestões da mesma categoria:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {isLoadingSuggestions ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              suggestions.map((food) => (
                <Button
                  key={food.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={() => handleSelectFood(food)}
                >
                  {food.name}
                </Button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Food Search */}
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
          <PopoverContent className="w-[350px] p-0" align="start">
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
                      className="flex flex-col items-start py-2"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-medium text-sm">{food.name}</span>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            selectedFood?.id === food.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g (100g)
                      </span>
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
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="sub-amount">Quantidade (gramas)</Label>
            <Input
              id="sub-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
            <p className="text-xs text-muted-foreground">
              Quantidade calculada para equivalência calórica aproximada.
            </p>
          </div>

          {/* Comparison Display */}
          {macros && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">Comparação:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Original ({originalAmount}g):</p>
                  <p>{originalMacros.calories} kcal</p>
                  <p className="text-xs text-muted-foreground">
                    P: {originalMacros.protein}g | C: {originalMacros.carbs}g | G: {originalMacros.fat}g
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Substituição ({amount}g):</p>
                  <p>{macros.calories} kcal</p>
                  <p className="text-xs text-muted-foreground">
                    P: {macros.protein}g | C: {macros.carbs}g | G: {macros.fat}g
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleAdd}
            disabled={!selectedFood || !amount || parseFloat(amount) <= 0 || disabled}
            className="w-full"
            size="sm"
          >
            Adicionar Substituição
          </Button>
        </>
      )}
    </div>
  );
}
