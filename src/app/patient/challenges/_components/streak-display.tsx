"use client";

import { Flame, Trophy, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  currentStreak: number;
  bestStreak: number;
  totalCheckins?: number;
  className?: string;
}

export function StreakDisplay({
  currentStreak,
  bestStreak,
  totalCheckins,
  className,
}: StreakDisplayProps) {
  // Determine flame intensity based on streak
  const getFlameIntensity = () => {
    if (currentStreak >= 21) return "text-orange-500";
    if (currentStreak >= 14) return "text-amber-500";
    if (currentStreak >= 7) return "text-yellow-500";
    if (currentStreak >= 3) return "text-yellow-400";
    return "text-muted-foreground";
  };

  const getFlameSize = () => {
    if (currentStreak >= 21) return "h-10 w-10";
    if (currentStreak >= 14) return "h-9 w-9";
    if (currentStreak >= 7) return "h-8 w-8";
    return "h-7 w-7";
  };

  const isOnFire = currentStreak >= 3;

  return (
    <div className={cn("rounded-2xl border bg-card p-4", className)}>
      {/* Main streak display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center rounded-full p-2",
            isOnFire ? "bg-orange-100" : "bg-muted"
          )}>
            <Flame className={cn(
              getFlameSize(),
              getFlameIntensity(),
              isOnFire && "animate-pulse"
            )} />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-3xl font-bold tabular-nums",
                isOnFire ? "text-orange-600" : "text-foreground"
              )}>
                {currentStreak}
              </span>
              <span className="text-sm text-muted-foreground">
                {currentStreak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sequência atual
            </p>
          </div>
        </div>

        {/* Best streak badge */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1">
            <Trophy className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {bestStreak} {bestStreak === 1 ? "dia" : "dias"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Melhor sequência</span>
        </div>
      </div>

      {/* Progress bar to next milestone */}
      {currentStreak > 0 && currentStreak < 21 && (
        <div className="mt-4">
          <StreakMilestoneProgress currentStreak={currentStreak} />
        </div>
      )}

      {/* Stats row */}
      {totalCheckins !== undefined && (
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{totalCheckins} check-ins no total</span>
          </div>
          {currentStreak > 0 && currentStreak === bestStreak && (
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              <span>Recorde pessoal!</span>
            </div>
          )}
        </div>
      )}

      {/* Motivational message */}
      <MotivationalMessage currentStreak={currentStreak} />
    </div>
  );
}

function StreakMilestoneProgress({ currentStreak }: { currentStreak: number }) {
  // Determine next milestone
  const milestones = [7, 14, 21];
  const nextMilestone = milestones.find(m => m > currentStreak) || 21;
  const prevMilestone = milestones.filter(m => m <= currentStreak).pop() || 0;

  const progress = ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
  const daysToGo = nextMilestone - currentStreak;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Próximo marco: {nextMilestone} dias
        </span>
        <span className="font-medium text-primary">
          Faltam {daysToGo} {daysToGo === 1 ? "dia" : "dias"}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{prevMilestone > 0 ? `${prevMilestone}d` : "Início"}</span>
        <span>{nextMilestone}d 🏆</span>
      </div>
    </div>
  );
}

function MotivationalMessage({ currentStreak }: { currentStreak: number }) {
  const getMessage = () => {
    if (currentStreak === 0) {
      return {
        emoji: "💪",
        message: "Faça seu primeiro check-in hoje!",
      };
    }
    if (currentStreak === 1) {
      return {
        emoji: "🌱",
        message: "Ótimo começo! Continue amanhã.",
      };
    }
    if (currentStreak < 7) {
      return {
        emoji: "🔥",
        message: `${7 - currentStreak} dias para sua primeira conquista!`,
      };
    }
    if (currentStreak === 7) {
      return {
        emoji: "🎉",
        message: "1 semana completa! Você está arrasando!",
      };
    }
    if (currentStreak < 14) {
      return {
        emoji: "⚡",
        message: "Você está imparável! Continue assim.",
      };
    }
    if (currentStreak === 14) {
      return {
        emoji: "🏆",
        message: "2 semanas! Você é dedicação pura!",
      };
    }
    if (currentStreak < 21) {
      return {
        emoji: "🚀",
        message: "Quase lá! A conquista máxima está próxima.",
      };
    }
    return {
      emoji: "👑",
      message: "3 semanas! Você é uma lenda!",
    };
  };

  const { emoji, message } = getMessage();

  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
      <span className="text-lg">{emoji}</span>
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}

// Compact version for inline display
export function StreakBadge({
  currentStreak,
  className,
}: {
  currentStreak: number;
  className?: string;
}) {
  const isOnFire = currentStreak >= 3;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
      isOnFire ? "bg-orange-100" : "bg-muted",
      className
    )}>
      <Flame className={cn(
        "h-4 w-4",
        isOnFire ? "text-orange-500" : "text-muted-foreground"
      )} />
      <span className={cn(
        "text-sm font-medium tabular-nums",
        isOnFire ? "text-orange-700" : "text-muted-foreground"
      )}>
        {currentStreak}
      </span>
    </div>
  );
}
