"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock, AlertCircle, Plus } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDateStr, parseDateStr, computeBlockedDateStrings, extractDateStrings } from "@/lib/date-utils";
import type { NutriTimeBlock } from "@/types/database";

interface DesktopCalendarSidebarProps {
  selectedDateStr: string;
  appointmentDateIsos: string[];
  calendarTimeBlocks: NutriTimeBlock[];
  timeBlocksForDay: NutriTimeBlock[];
  appointmentCount: number;
}

export function DesktopCalendarSidebar({
  selectedDateStr,
  appointmentDateIsos,
  calendarTimeBlocks,
  timeBlocksForDay,
  appointmentCount,
}: DesktopCalendarSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse date locally on client for correct timezone
  const selectedDate = parseDateStr(selectedDateStr);
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatDateStr(date));
    router.push(`/schedule?${params.toString()}`);
  }

  function goToToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatDateStr(new Date()));
    router.push(`/schedule?${params.toString()}`);
  }

  // Compute dates on client for correct timezone interpretation
  const daysWithAppointments = extractDateStrings(appointmentDateIsos).map((str) => parseDateStr(str));
  const blockedDateStrs = computeBlockedDateStrings(calendarTimeBlocks);
  const daysBlocked = blockedDateStrs.map((str) => parseDateStr(str));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="hidden lg:block"
    >
      <div className="sticky top-6 space-y-4">
        {/* Calendar Card */}
        <div className="bg-card rounded-2xl border shadow-soft overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Calendário</h2>
                  <p className="text-xs text-muted-foreground">
                    Selecione uma data
                  </p>
                </div>
              </div>
              {!isToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs rounded-full"
                  onClick={goToToday}
                >
                  Hoje
                </Button>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={{
                hasAppointment: daysWithAppointments,
                blocked: daysBlocked,
              }}
              modifiersClassNames={{
                hasAppointment: "font-bold underline decoration-primary decoration-2",
                blocked: "bg-destructive/10 text-destructive",
              }}
            />
          </div>

          {/* Legend */}
          <div className="px-4 pb-4">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground pt-3 border-t">
              <div className="flex items-center gap-1.5">
                <span className="font-bold underline decoration-primary decoration-2">15</span>
                <span>Com consultas</span>
              </div>
              {blockedDateStrs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-5 rounded bg-destructive/10 text-center leading-5 text-destructive text-[10px]">
                    15
                  </span>
                  <span>Bloqueado</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Day Summary */}
        <div className="bg-card rounded-2xl border shadow-soft p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex flex-col items-center justify-center",
              isToday ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <span className="text-[10px] uppercase tracking-wider font-medium opacity-80">
                {selectedDate.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3)}
              </span>
              <span className="text-lg font-bold leading-none">
                {selectedDate.getDate()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">
                {selectedDate.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long"
                })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {appointmentCount === 0
                  ? "Nenhuma consulta"
                  : `${appointmentCount} consulta${appointmentCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Time blocks warning */}
          {timeBlocksForDay.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">
                    Bloqueios
                  </p>
                  <ul className="space-y-0.5 text-amber-600 dark:text-amber-500 text-xs">
                    {timeBlocksForDay.map((block) => (
                      <li key={block.id}>
                        {block.title}
                        {block.block_type !== "other" && (
                          <span className="opacity-70 ml-1">
                            ({block.block_type === "personal" ? "Pessoal" :
                              block.block_type === "holiday" ? "Feriado" :
                              block.block_type === "vacation" ? "Férias" : block.block_type})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Quick action */}
          <Button asChild className="w-full rounded-full" size="sm">
            <Link href="/schedule/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Consulta
            </Link>
          </Button>
        </div>

        {/* Quick links */}
        <div className="bg-card rounded-2xl border shadow-soft p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Ações Rápidas</h3>
          <div className="space-y-2">
            <Link
              href="/settings/availability"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-sm"
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              Configurar Disponibilidade
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
