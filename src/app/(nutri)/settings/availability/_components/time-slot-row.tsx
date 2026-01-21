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
import { Trash2 } from "lucide-react";

interface TimeSlotRowProps {
  startTime: string;
  endTime: string;
  isActive: boolean;
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
  onStartTimeChange,
  onEndTimeChange,
  onToggleActive,
  onRemove,
}: TimeSlotRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={isActive} onCheckedChange={onToggleActive} />

      <div className="flex flex-1 items-center gap-2">
        <Select value={startTime} onValueChange={onStartTimeChange}>
          <SelectTrigger className="w-[110px]">
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

        <span className="text-muted-foreground">até</span>

        <Select value={endTime} onValueChange={onEndTimeChange}>
          <SelectTrigger className="w-[110px]">
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

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remover horário</span>
      </Button>
    </div>
  );
}
