"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  UtensilsCrossed,
  Package,
  Sparkles,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import Link from "next/link";
import type { FoodItem } from "@/types/database";

interface FoodsListProps {
  foods: FoodItem[];
  searchQuery?: string;
  stats: {
    total: number;
    custom: number;
    official: number;
  };
}

function MacroBar({
  label,
  value,
  unit,
  percentage,
}: {
  label: string;
  value: number;
  unit: string;
  percentage: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function FoodCard({ food, index }: { food: FoodItem; index: number }) {
  const totalMacros = food.protein + food.carbs + food.fat;
  const proteinPct = totalMacros > 0 ? (food.protein / totalMacros) * 100 : 0;
  const carbsPct = totalMacros > 0 ? (food.carbs / totalMacros) * 100 : 0;
  const fatPct = totalMacros > 0 ? (food.fat / totalMacros) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link href={`/foods/${food.id}`}>
        <Card className="group h-full rounded-2xl border bg-card shadow-soft hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {food.name}
                </h3>
                {food.category && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {food.category}
                  </p>
                )}
              </div>
              {food.source === "custom" ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                  <Sparkles className="h-3 w-3" />
                  <span>Personalizado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium shrink-0">
                  <Package className="h-3 w-3" />
                  <span>Oficial</span>
                </div>
              )}
            </div>

            {/* Calories highlight */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold tracking-tight">
                {food.calories}
              </span>
              <span className="text-sm text-muted-foreground">kcal</span>
              {food.portion_size && food.portion_unit && (
                <span className="text-xs text-muted-foreground ml-auto">
                  por {food.portion_size}
                  {food.portion_unit}
                </span>
              )}
            </div>

            {/* Macro bars */}
            <div className="space-y-2.5">
              <MacroBar
                label="Proteínas"
                value={food.protein}
                unit="g"
                percentage={proteinPct}
              />
              <MacroBar
                label="Carboidratos"
                value={food.carbs}
                unit="g"
                percentage={carbsPct}
              />
              <MacroBar
                label="Gorduras"
                value={food.fat}
                unit="g"
                percentage={fatPct}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-1">
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Ver detalhes
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function FoodListItem({ food, index }: { food: FoodItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
    >
      <Link href={`/foods/${food.id}`}>
        <div className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all duration-200">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                {food.name}
              </h3>
              {food.source === "custom" && (
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </div>
            {food.category && (
              <p className="text-xs text-muted-foreground truncate">
                {food.category}
              </p>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <div className="text-center min-w-[60px]">
              <span className="font-medium text-foreground">{food.protein}g</span>
              <p className="text-xs">Prot</p>
            </div>
            <div className="text-center min-w-[60px]">
              <span className="font-medium text-foreground">{food.carbs}g</span>
              <p className="text-xs">Carb</p>
            </div>
            <div className="text-center min-w-[60px]">
              <span className="font-medium text-foreground">{food.fat}g</span>
              <p className="text-xs">Gord</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-lg font-semibold">{food.calories}</span>
            <span className="text-xs text-muted-foreground ml-0.5">kcal</span>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

export function FoodsList({ foods, searchQuery, stats }: FoodsListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{stats.custom}</p>
              <p className="text-xs text-muted-foreground">Personalizados</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{stats.official}</p>
              <p className="text-xs text-muted-foreground">Oficiais</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search & Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <form className="flex-1" action="/foods" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar alimentos..."
              defaultValue={searchQuery}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </form>

        <div className="flex gap-2">
          <div className="flex rounded-xl border bg-card p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button asChild className="rounded-full h-11 px-5 gap-2">
            <Link href="/foods/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Alimento</span>
              <span className="sm:hidden">Novo</span>
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Food Items */}
      <AnimatePresence mode="wait">
        {foods.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="rounded-2xl border bg-card shadow-soft">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">
                  {searchQuery
                    ? "Nenhum alimento encontrado"
                    : "Nenhum alimento cadastrado"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                  {searchQuery
                    ? `Não encontramos alimentos com "${searchQuery}". Tente outro termo ou adicione um novo alimento.`
                    : "Comece cadastrando seu primeiro alimento para criar planos alimentares personalizados."}
                </p>
                {!searchQuery && (
                  <Button asChild className="mt-6 rounded-full px-6">
                    <Link href="/foods/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar Alimento
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {foods.map((food, index) => (
              <FoodCard key={food.id} food={food} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {foods.map((food, index) => (
              <FoodListItem key={food.id} food={food} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
