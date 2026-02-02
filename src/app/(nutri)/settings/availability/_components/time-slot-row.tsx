"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Clock } from "lucide-react";

interface TimeSlotRowProps {
  startTime: string;
  endTime: string;
  isActive: boolean;
  duration?: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onToggleActive: (value: boolean) => void;
  onRemove: () => void;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

export function TimeSlotRow({
  startTime,
  endTime,
  isActive,
  duration,
  onStartTimeChange,
  onEndTimeChange,
  onToggleActive,
  onRemove,
}: TimeSlotRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border bg-card transition-all duration-200 ${
        isActive
          ? "border-primary/20 shadow-sm"
          : "border-muted opacity-60"
      }`}
    >
      {/* Toggle & Remove (Mobile) */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={onToggleActive}
            className="data-[state=checked]:bg-emerald-500"
          />
          <span className="text-xs text-muted-foreground sm:hidden">
            {isActive ? "Ativo" : "Inativo"}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:hidden"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remover horário</span>
        </Button>
      </div>

      {/* Time Selectors */}
      <div className="flex flex-1 items-center gap-2">
        <Select value={startTime} onValueChange={onStartTimeChange}>
          <SelectTrigger className="flex-1 sm:w-[110px] sm:flex-none h-10 rounded-xl">
            <SelectValue placeholder="Início" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-muted-foreground">
          <div className="hidden sm:block w-4 h-px bg-border" />
          <span className="text-xs sm:text-sm">até</span>
          <div className="hidden sm:block w-4 h-px bg-border" />
        </div>

        <Select value={endTime} onValueChange={onEndTimeChange}>
          <SelectTrigger className="flex-1 sm:w-[110px] sm:flex-none h-10 rounded-xl">
            <SelectValue placeholder="Fim" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.filter((time) => time > startTime).map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Badge */}
      {duration && (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {duration}
        </div>
      )}

      {/* Remove Button (Desktop) */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="hidden sm:flex h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remover horário</span>
      </Button>
    </div>
  );
}
