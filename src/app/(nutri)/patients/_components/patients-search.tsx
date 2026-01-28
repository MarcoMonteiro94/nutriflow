"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientsSearchProps {
  defaultValue?: string;
  totalCount: number;
}

export function PatientsSearch({ defaultValue, totalCount }: PatientsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue || "");
  const [isFocused, setIsFocused] = useState(false);

  function handleSearch(term: string) {
    setValue(term);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      router.push(`/patients?${params.toString()}`);
    });
  }

  function clearSearch() {
    setValue("");
    startTransition(() => {
      router.push("/patients");
    });
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className={cn(
        "relative flex items-center gap-2 bg-card rounded-2xl border shadow-soft p-2 transition-all",
        isFocused && "ring-2 ring-primary/20 border-primary/30"
      )}>
        <div className="flex items-center gap-2 flex-1">
          {isPending ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin ml-2" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
          )}
          <Input
            type="search"
            placeholder="Buscar por nome, email ou telefone..."
            value={value}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm sm:text-base"
          />
        </div>

        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      <AnimatePresence mode="wait">
        {value && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between px-1"
          >
            <p className="text-sm text-muted-foreground">
              {totalCount === 0 ? (
                "Nenhum resultado"
              ) : totalCount === 1 ? (
                "1 paciente encontrado"
              ) : (
                `${totalCount} pacientes encontrados`
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
