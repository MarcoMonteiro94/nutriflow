"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface MobileCalendarDrawerProps {
  selectedDate: Date;
  appointmentDates: Date[];
  blockedDates?: Date[];
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MobileCalendarDrawer({
  selectedDate,
  appointmentDates,
  blockedDates = [],
}: MobileCalendarDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const isToday = new Date().toDateString() === selectedDate.toDateString();
  const isTomorrow = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toDateString() === selectedDate.toDateString();
  })();

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatLocalDate(date));
    router.push(`/schedule?${params.toString()}`);
    setOpen(false);
  }

  function navigateDay(direction: "prev" | "next") {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatLocalDate(newDate));
    router.push(`/schedule?${params.toString()}`);
  }

  function goToToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatLocalDate(new Date()));
    router.push(`/schedule?${params.toString()}`);
  }

  const daysWithAppointments = appointmentDates.map((date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const daysBlocked = blockedDates.map((date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  return (
    <div className="lg:hidden">
      {/* Date navigation bar */}
      <div className="flex items-center justify-between gap-2 p-4 bg-card rounded-2xl border shadow-soft mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full shrink-0"
          onClick={() => navigateDay("prev")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button className="flex-1 flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl hover:bg-muted/50 transition-colors">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {isToday ? "Hoje" : isTomorrow ? "Amanhã" : selectedDate.toLocaleDateString("pt-BR", { weekday: "short" })}
              </span>
              <span className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short"
                })}
              </span>
            </button>
          </DrawerTrigger>

          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <DrawerTitle>Selecionar Data</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="p-4 overflow-auto">
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
                className="mx-auto"
              />

              {/* Quick actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => {
                    goToToday();
                    setOpen(false);
                  }}
                >
                  Ir para Hoje
                </Button>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold underline decoration-primary decoration-2">15</span>
                  <span>Com consultas</span>
                </div>
                {blockedDates.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 rounded bg-destructive/10 text-center leading-5 text-destructive text-[10px]">
                      15
                    </span>
                    <span>Bloqueado</span>
                  </div>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full shrink-0"
          onClick={() => navigateDay("next")}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Today button if not on today */}
      {!isToday && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-full"
            onClick={goToToday}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Voltar para Hoje
          </Button>
        </motion.div>
      )}
    </div>
  );
}
