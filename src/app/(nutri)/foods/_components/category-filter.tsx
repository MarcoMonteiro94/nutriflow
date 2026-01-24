"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryFilterProps {
  categories: string[];
  currentCategory?: string;
}

export function CategoryFilter({ categories, currentCategory }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleCategoryChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }

    router.push(`/foods?${params.toString()}`);
  }

  return (
    <Select
      value={currentCategory ?? "all"}
      onValueChange={handleCategoryChange}
    >
      <SelectTrigger className="w-full sm:w-[240px]">
        <SelectValue placeholder="Todas as categorias" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as categorias</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
