"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Calendar,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  format,
  eachDayOfInterval,
  isSameDay,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ChallengeCheckin } from "@/types/database";

interface CheckinCalendarProps {
  participantId: string;
  challengeId: string;
  startDate: Date;
  endDate: Date;
  checkins: ChallengeCheckin[];
  isActive: boolean;
  todayCheckin?: ChallengeCheckin;
}

export function CheckinCalendar({
  participantId,
  challengeId,
  startDate,
  endDate,
  checkins,
  isActive,
  todayCheckin,
}: CheckinCalendarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const today = startOfDay(new Date());
  const checkinDates = new Set(checkins.map((c) => c.checkin_date));
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const canCheckinToday = isActive && !todayCheckin && !isBefore(today, startDate);

  async function handleCheckin() {
    setIsLoading(true);

    try {
      const todayStr = format(today, "yyyy-MM-dd");

      const { error } = await supabase.from("challenge_checkins").insert({
        participant_id: participantId,
        checkin_date: todayStr,
        completed: true,
      });

      if (error) throw error;

      setShowSuccess(true);
      toast.success("Check-in realizado com sucesso! 🎉");

      // Hide success animation after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Error creating checkin:", error);
      toast.error("Erro ao fazer check-in");
    } finally {
      setIsLoading(false);
    }
  }

  function getDayStatus(day: Date) {
    const dayStr = format(day, "yyyy-MM-dd");
    const isCheckedIn = checkinDates.has(dayStr);
    const isToday = isSameDay(day, today);
    const isPast = isBefore(day, today) && !isToday;
    const isFuture = isAfter(day, today);

    if (isCheckedIn) return "completed";
    if (isToday && canCheckinToday) return "today";
    if (isPast) return "missed";
    if (isFuture) return "future";
    return "today-done";
  }

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Calendário de Check-ins</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Check-in Button */}
        {isActive && (
          <div className="relative">
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center bg-card rounded-xl z-10"
                >
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Sparkles className="h-12 w-12" />
                    </motion.div>
                    <p className="font-semibold">Check-in feito!</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {canCheckinToday ? (
              <Button
                onClick={handleCheckin}
                disabled={isLoading}
                className="w-full h-14 text-lg rounded-xl gap-3"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Fazer Check-in de Hoje
              </Button>
            ) : todayCheckin ? (
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Check-in de hoje realizado!</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Calendar Grid */}
        <div className="space-y-3">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before start */}
            {Array.from({ length: startDate.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Challenge days */}
            {allDays.map((day, index) => {
              const status = getDayStatus(day);
              const dayNumber = format(day, "d");

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                    transition-colors relative
                    ${status === "completed" ? "bg-primary text-primary-foreground" : ""}
                    ${status === "today" ? "bg-primary/20 text-primary ring-2 ring-primary" : ""}
                    ${status === "today-done" ? "bg-primary text-primary-foreground ring-2 ring-primary" : ""}
                    ${status === "missed" ? "bg-muted/50 text-muted-foreground" : ""}
                    ${status === "future" ? "bg-muted/30 text-muted-foreground" : ""}
                  `}
                >
                  <span className="font-medium">{dayNumber}</span>
                  {status === "completed" && (
                    <CheckCircle2 className="h-3 w-3 absolute bottom-1" />
                  )}
                  {status === "missed" && (
                    <Circle className="h-3 w-3 absolute bottom-1 text-muted-foreground/50" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-primary" />
            <span>Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-primary/20 ring-2 ring-primary" />
            <span>Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted/50" />
            <span>Não feito</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted/30" />
            <span>Futuro</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
