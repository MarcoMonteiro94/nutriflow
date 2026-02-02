"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Award,
  Flame,
  Target,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays, isAfter, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Challenge, ChallengeParticipant, ChallengeCheckin } from "@/types/database";

type ParticipantWithChallenge = ChallengeParticipant & {
  challenge: Challenge;
  checkins: ChallengeCheckin[];
};

interface PatientChallengesListProps {
  participations: ParticipantWithChallenge[];
  stats: {
    total: number;
    active: number;
    completed: number;
  };
}

function getStatusConfig(challenge: Challenge, badgeEarned: boolean) {
  if (badgeEarned) {
    return {
      label: "Concluído",
      variant: "default" as const,
      bgClass: "bg-primary/10 text-primary",
    };
  }

  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);

  if (challenge.status === "completed" || isAfter(now, endDate)) {
    return {
      label: "Encerrado",
      variant: "secondary" as const,
      bgClass: "bg-muted text-muted-foreground",
    };
  }

  if (challenge.status === "active" && isBefore(now, endDate) && isAfter(now, startDate)) {
    return {
      label: "Em andamento",
      variant: "default" as const,
      bgClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    };
  }

  if (isBefore(now, startDate)) {
    return {
      label: "Em breve",
      variant: "outline" as const,
      bgClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }

  return {
    label: "Pendente",
    variant: "outline" as const,
    bgClass: "bg-muted text-muted-foreground",
  };
}

function hasCheckedInToday(checkins: ChallengeCheckin[]): boolean {
  return checkins.some((c) => isToday(new Date(c.checkin_date)));
}

function ChallengeCard({
  participation,
  index,
}: {
  participation: ParticipantWithChallenge;
  index: number;
}) {
  const { challenge, checkins, badge_earned } = participation;
  const statusConfig = getStatusConfig(challenge, badge_earned);
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const now = new Date();
  const hasStarted = isAfter(now, startDate);
  const hasEnded = isAfter(now, endDate);
  const checkedToday = hasCheckedInToday(checkins);

  const daysPassed = hasStarted
    ? Math.min(differenceInDays(now, startDate) + 1, totalDays)
    : 0;
  const daysRemaining = hasEnded ? 0 : Math.max(differenceInDays(endDate, now), 0);
  const overallProgress = Math.round((checkins.length / totalDays) * 100);

  const isActive = challenge.status === "active" && hasStarted && !hasEnded;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/patient/challenges/${challenge.id}`}>
        <Card className="group relative overflow-hidden rounded-2xl border bg-card hover:border-primary/30 transition-all duration-300">
          {/* Progress indicator bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.08 + 0.2 }}
            />
          </div>

          <CardContent className="p-5 pt-6">
            {/* Header with title and status */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                  {challenge.title}
                </h3>
                {challenge.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {challenge.description}
                  </p>
                )}
              </div>
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.bgClass}`}>
                {statusConfig.label}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{checkins.length}/{totalDays}</p>
                  <p className="text-[11px] text-muted-foreground">check-ins</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {hasEnded ? totalDays : daysRemaining}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {hasEnded ? "dias total" : "dias restantes"}
                  </p>
                </div>
              </div>
            </div>

            {/* Period */}
            <p className="text-xs text-muted-foreground mb-4">
              {format(startDate, "d 'de' MMM", { locale: ptBR })} — {format(endDate, "d 'de' MMM, yyyy", { locale: ptBR })}
            </p>

            {/* Progress section */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Progresso</span>
                <span className="text-xs font-semibold tabular-nums">{overallProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.08 + 0.3 }}
                />
              </div>
            </div>

            {/* Badge earned */}
            {badge_earned && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Desafio concluído!</span>
              </div>
            )}

            {/* Action hint */}
            <div className="flex items-center justify-between pt-3 border-t">
              {isActive && !checkedToday ? (
                <div className="flex items-center gap-2 text-primary">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-medium">Fazer check-in de hoje</span>
                </div>
              ) : isActive && checkedToday ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Check-in feito!</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Ver detalhes</span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  delay,
  variant = "default",
}: {
  icon: typeof Trophy;
  value: number;
  label: string;
  delay: number;
  variant?: "default" | "active" | "muted";
}) {
  const bgVariants = {
    default: "bg-primary/10",
    active: "bg-emerald-500/10",
    muted: "bg-muted",
  };

  const iconVariants = {
    default: "text-primary",
    active: "text-emerald-600 dark:text-emerald-400",
    muted: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border bg-card p-3 sm:p-4"
    >
      {/* Mobile: vertical centered */}
      <div className="flex flex-col items-center text-center gap-1 sm:hidden">
        <Icon className={`h-5 w-5 mb-1 ${iconVariants[variant]}`} />
        <p className="text-xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>

      {/* Desktop: horizontal with icon box */}
      <div className="hidden sm:flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgVariants[variant]}`}>
          <Icon className={`h-5 w-5 ${iconVariants[variant]}`} />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function PatientChallengesList({
  participations,
  stats,
}: PatientChallengesListProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Trophy}
          value={stats.total}
          label="Total"
          delay={0.05}
          variant="default"
        />
        <StatCard
          icon={Target}
          value={stats.active}
          label="Ativos"
          delay={0.1}
          variant="active"
        />
        <StatCard
          icon={Award}
          value={stats.completed}
          label="Concluídos"
          delay={0.15}
          variant="muted"
        />
      </div>

      {/* Challenges List */}
      {participations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="rounded-2xl border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-center">
                Nenhum desafio disponível
              </h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
                Quando seu nutricionista criar um desafio para você, ele aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {participations.map((participation, index) => (
            <ChallengeCard
              key={participation.id}
              participation={participation}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
