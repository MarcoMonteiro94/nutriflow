"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trophy,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  ChevronRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Challenge, ChallengeParticipant, Patient } from "@/types/database";

type ChallengeWithStats = Challenge & {
  participants: (ChallengeParticipant & { patient: Patient })[];
  _count: {
    participants: number;
    checkins: number;
  };
};

interface ChallengesListProps {
  challenges: ChallengeWithStats[];
  stats: {
    total: number;
    active: number;
    completed: number;
    participants: number;
  };
}

function getStatusConfig(challenge: Challenge) {
  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);

  if (challenge.status === "cancelled") {
    return {
      label: "Cancelado",
      variant: "destructive" as const,
      icon: null,
    };
  }

  if (challenge.status === "completed" || isAfter(now, endDate)) {
    return {
      label: "Concluído",
      variant: "secondary" as const,
      icon: CheckCircle2,
    };
  }

  if (challenge.status === "active" && isBefore(now, endDate) && isAfter(now, startDate)) {
    return {
      label: "Ativo",
      variant: "default" as const,
      icon: Play,
    };
  }

  if (isBefore(now, startDate)) {
    return {
      label: "Agendado",
      variant: "outline" as const,
      icon: Clock,
    };
  }

  return {
    label: "Rascunho",
    variant: "outline" as const,
    icon: null,
  };
}

function ChallengeCard({
  challenge,
  index,
}: {
  challenge: ChallengeWithStats;
  index: number;
}) {
  const statusConfig = getStatusConfig(challenge);
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const now = new Date();

  let progress = 0;
  if (isAfter(now, startDate)) {
    const daysPassed = differenceInDays(now, startDate) + 1;
    progress = Math.min((daysPassed / totalDays) * 100, 100);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/challenges/${challenge.id}`}>
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
                <Users className="h-4 w-4" />
                <span>{challenge._count.participants} participantes</span>
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
            {challenge.status === "active" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end pt-1">
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Ver detalhes
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export function ChallengesList({ challenges, stats }: ChallengesListProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {stats.completed}
              </p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {stats.participants}
              </p>
              <p className="text-xs text-muted-foreground">Participantes</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Challenges Grid */}
      {challenges.length === 0 ? (
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
                Nenhum desafio criado
              </h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                Crie seu primeiro desafio para motivar seus pacientes e
                acompanhar o progresso deles.
              </p>
              <Button asChild className="mt-6 rounded-full px-6">
                <Link href="/challenges/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Desafio
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge, index) => (
            <ChallengeCard key={challenge.id} challenge={challenge} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
