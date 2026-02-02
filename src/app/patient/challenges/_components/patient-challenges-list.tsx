"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  ChevronRight,
  Zap,
  Award,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
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
      icon: Award,
      color: "text-primary",
    };
  }

  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);

  if (challenge.status === "completed" || isAfter(now, endDate)) {
    return {
      label: "Encerrado",
      variant: "secondary" as const,
      icon: CheckCircle2,
      color: "text-muted-foreground",
    };
  }

  if (challenge.status === "active" && isBefore(now, endDate) && isAfter(now, startDate)) {
    return {
      label: "Em andamento",
      variant: "default" as const,
      icon: Play,
      color: "text-emerald-600",
    };
  }

  if (isBefore(now, startDate)) {
    return {
      label: "Em breve",
      variant: "outline" as const,
      icon: Clock,
      color: "text-amber-600",
    };
  }

  return {
    label: "Pendente",
    variant: "outline" as const,
    icon: null,
    color: "text-muted-foreground",
  };
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

  const daysPassed = isAfter(now, startDate)
    ? Math.min(differenceInDays(now, startDate) + 1, totalDays)
    : 0;
  const checkinRate = daysPassed > 0
    ? Math.round((checkins.length / daysPassed) * 100)
    : 0;
  const overallProgress = Math.round((checkins.length / totalDays) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/patient/challenges/${challenge.id}`}>
        <Card className="group h-full rounded-2xl border bg-card shadow-soft hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer">
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {challenge.title}
                </h3>
                {challenge.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {challenge.description}
                  </p>
                )}
              </div>
              <Badge variant={statusConfig.variant} className="shrink-0">
                {statusConfig.icon && (
                  <statusConfig.icon className="h-3 w-3 mr-1" />
                )}
                {statusConfig.label}
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {checkins.length} de {daysPassed} check-ins
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{totalDays} dias</span>
              </div>
            </div>

            {/* Period */}
            <div className="text-xs text-muted-foreground">
              {format(startDate, "d MMM", { locale: ptBR })} -{" "}
              {format(endDate, "d MMM yyyy", { locale: ptBR })}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso geral</span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    badge_earned ? "bg-primary" : "bg-primary/70"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Badge earned indicator */}
            {badge_earned && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm">
                <Award className="h-4 w-4" />
                <span className="font-medium">Badge conquistado!</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end pt-1">
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                {challenge.status === "active" ? "Fazer check-in" : "Ver detalhes"}
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {stats.active}
              </p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Award className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {stats.completed}
              </p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Challenges List */}
      {participations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-2xl border bg-card shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">
                Nenhum desafio disponível
              </h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                Você ainda não foi adicionado a nenhum desafio. Quando seu
                nutricionista criar um desafio para você, ele aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
