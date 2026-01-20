"use client";

import { Check, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: Error | null;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  error,
  className,
}: SaveStatusIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-opacity duration-200",
        status === "idle" && "opacity-0",
        status !== "idle" && "opacity-100",
        className
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Salvando...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Salvo</span>
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="h-4 w-4 text-destructive" />
          <span className="text-destructive">
            {error?.message || "Erro ao salvar"}
          </span>
        </>
      )}
    </div>
  );
}
