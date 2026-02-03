"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, Flame, Target, Award, Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AchievementType, ParticipantAchievement } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Extended type with properly typed achievement_type
type TypedParticipantAchievement = Omit<ParticipantAchievement, "achievement_type"> & {
  achievement_type: AchievementType;
};

interface AchievementsDisplayProps {
  achievements: ParticipantAchievement[];
  className?: string;
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, {
  icon: typeof Trophy;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  streak_7: {
    icon: Flame,
    label: "7 Dias",
    description: "Sequência de 7 dias consecutivos",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200",
  },
  streak_14: {
    icon: Flame,
    label: "14 Dias",
    description: "Sequência de 14 dias consecutivos",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-200",
  },
  streak_21: {
    icon: Flame,
    label: "21 Dias",
    description: "Sequência de 21 dias - Hábito formado!",
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
  },
  goal_complete: {
    icon: Target,
    label: "Meta Completa",
    description: "Completou uma meta do desafio",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-200",
  },
  phase_complete: {
    icon: Award,
    label: "Fase Completa",
    description: "Completou uma fase do desafio",
    color: "text-sky-600",
    bgColor: "bg-sky-100",
    borderColor: "border-sky-200",
  },
  challenge_complete: {
    icon: Trophy,
    label: "Desafio Completo",
    description: "Completou o desafio inteiro!",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200",
  },
};

// All possible achievements in order
const ALL_ACHIEVEMENTS: AchievementType[] = [
  "streak_7",
  "streak_14",
  "streak_21",
  "goal_complete",
  "phase_complete",
  "challenge_complete",
];

export function AchievementsDisplay({
  achievements,
  className,
}: AchievementsDisplayProps) {
  // Create a map of earned achievements
  const earnedMap = new Map<AchievementType, TypedParticipantAchievement>();
  achievements.forEach((a) => {
    const achievementType = a.achievement_type as AchievementType;
    // Keep the earliest achievement of each type
    if (!earnedMap.has(achievementType) ||
        new Date(a.earned_at || "") < new Date(earnedMap.get(achievementType)!.earned_at || "")) {
      earnedMap.set(achievementType, { ...a, achievement_type: achievementType });
    }
  });

  const earnedCount = earnedMap.size;
  const totalCount = ALL_ACHIEVEMENTS.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Conquistas</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {earnedCount}/{totalCount}
        </span>
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-3 gap-3">
        {ALL_ACHIEVEMENTS.map((type) => {
          const config = ACHIEVEMENT_CONFIG[type];
          const earned = earnedMap.get(type);
          const isEarned = !!earned;

          return (
            <AchievementBadge
              key={type}
              type={type}
              config={config}
              earned={isEarned}
              earnedAt={earned?.earned_at ?? undefined}
            />
          );
        })}
      </div>

      {/* Progress message */}
      {earnedCount === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Complete check-ins para desbloquear conquistas!
        </p>
      )}
    </div>
  );
}

interface AchievementBadgeProps {
  type: AchievementType;
  config: typeof ACHIEVEMENT_CONFIG[AchievementType];
  earned: boolean;
  earnedAt?: string;
}

function AchievementBadge({ type, config, earned, earnedAt }: AchievementBadgeProps) {
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
        earned
          ? cn(config.bgColor, config.borderColor)
          : "border-dashed border-muted-foreground/20 bg-muted/30"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          earned ? "bg-white shadow-sm" : "bg-muted"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            earned ? config.color : "text-muted-foreground/40"
          )}
        />
      </div>
      <span
        className={cn(
          "text-xs font-medium text-center",
          earned ? config.color : "text-muted-foreground/50"
        )}
      >
        {config.label}
      </span>

      {/* Earned indicator */}
      {earned && (
        <div className="absolute -right-1 -top-1">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-white" />
        </div>
      )}

      {/* Tooltip with earned date */}
      {earned && earnedAt && (
        <div className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(earnedAt), "dd/MM/yy", { locale: ptBR })}
          </span>
        </div>
      )}
    </div>
  );
}

// Compact inline achievements display
export function AchievementsBadges({
  achievements,
  maxDisplay = 5,
  className,
}: {
  achievements: ParticipantAchievement[];
  maxDisplay?: number;
  className?: string;
}) {
  // Get unique achievements
  const uniqueAchievements = Array.from(
    new Map(achievements.map((a) => [a.achievement_type, a])).values()
  );

  const displayAchievements = uniqueAchievements.slice(0, maxDisplay);
  const remaining = uniqueAchievements.length - maxDisplay;

  if (uniqueAchievements.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {displayAchievements.map((achievement) => {
        const achievementType = achievement.achievement_type as AchievementType;
        const config = ACHIEVEMENT_CONFIG[achievementType];
        const Icon = config.icon;

        return (
          <div
            key={achievement.id}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full",
              config.bgColor
            )}
            title={config.description}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          +{remaining}
        </div>
      )}
    </div>
  );
}

// Celebration component for newly earned achievements
export function AchievementCelebration({
  achievement,
  onClose,
}: {
  achievement: AchievementType;
  onClose: () => void;
}) {
  const config = ACHIEVEMENT_CONFIG[achievement];
  const Icon = config.icon;

  // Trigger confetti on mount
  useEffect(() => {
    // Central burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Side bursts for extra effect
    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl animate-in zoom-in-95">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-amber-500 shadow-lg">
          <Icon className="size-10 text-white" />
        </div>

        <h2 className="mb-2 text-xl font-bold">Nova Conquista!</h2>
        <h3 className={cn("mb-1 text-lg font-semibold", config.color)}>
          {config.label}
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          {config.description}
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-full bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90 transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
