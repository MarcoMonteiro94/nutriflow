"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { initializeParticipantProgress } from "@/lib/challenges/phase-utils";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Lock,
  Target,
  Camera,
  Scale,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GoalCheckinForm } from "./goal-checkin-form";
import { StreakDisplay } from "./streak-display";
import { AchievementsDisplay, AchievementCelebration } from "./achievements-display";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  Challenge,
  ChallengeParticipantV2,
  ChallengePhase,
  ChallengeGoal,
  GoalCheckin,
  ParticipantAchievement,
  AchievementType,
  GoalType,
} from "@/types/database";

interface V2ChallengeViewProps {
  challenge: Challenge;
  participant: ChallengeParticipantV2;
  phases: (ChallengePhase & { goals: ChallengeGoal[] })[];
  directGoals: ChallengeGoal[]; // goals without phase
  checkins: GoalCheckin[];
  achievements: ParticipantAchievement[];
  patientId: string;
}

const GOAL_TYPE_ICONS: Record<GoalType, typeof CheckCircle2> = {
  checkin: CheckCircle2,
  photo: Camera,
  metric: Scale,
};

export function V2ChallengeView({
  challenge,
  participant,
  phases,
  directGoals,
  checkins,
  achievements,
  patientId,
}: V2ChallengeViewProps) {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(phases.filter(p => p.id === participant.current_phase_id).map(p => p.id))
  );
  const [celebratingAchievement, setCelebratingAchievement] = useState<AchievementType | null>(null);

  // Calculate overall progress
  const allGoals = [...directGoals, ...phases.flatMap(p => p.goals)];

  // Determine effective current goal - use first goal if not initialized
  const getFirstAvailableGoal = (): ChallengeGoal | null => {
    if (phases.length > 0) {
      // Get first goal from first phase
      const firstPhase = phases[0];
      if (firstPhase.goals && firstPhase.goals.length > 0) {
        return firstPhase.goals[0];
      }
    }
    // Or first direct goal
    if (directGoals.length > 0) {
      return directGoals[0];
    }
    return null;
  };

  const effectiveCurrentGoalId = participant.current_goal_id || getFirstAvailableGoal()?.id || null;
  const effectiveCurrentPhaseId = participant.current_phase_id || (phases.length > 0 ? phases[0].id : null);

  // Track if we've already tried to initialize
  const hasInitialized = useRef(false);

  // Initialize participant progress if needed (runs only once)
  useEffect(() => {
    async function initialize() {
      // Only run once and only if needed
      if (hasInitialized.current) return;
      if (participant.current_goal_id) return; // Already initialized
      if (allGoals.length === 0) return; // No goals to initialize

      hasInitialized.current = true;
      setIsInitializing(true);

      try {
        await initializeParticipantProgress(participant.id, challenge.id);
        router.refresh();
      } catch (error) {
        console.error("Error initializing participant:", error);
        hasInitialized.current = false; // Allow retry on error
      } finally {
        setIsInitializing(false);
      }
    }
    initialize();
  }, [participant.current_goal_id, participant.id, challenge.id, allGoals.length, router]);

  // Track if we've set expanded phases
  const hasSetExpanded = useRef(false);

  // Expand first phase if none expanded (runs only once)
  useEffect(() => {
    if (hasSetExpanded.current) return;
    if (expandedPhases.size === 0 && effectiveCurrentPhaseId) {
      hasSetExpanded.current = true;
      setExpandedPhases(new Set([effectiveCurrentPhaseId]));
    }
  }, [effectiveCurrentPhaseId, expandedPhases.size]);
  const totalGoals = allGoals.length;
  const completedGoals = allGoals.filter(goal => {
    const goalCheckins = checkins.filter(c => c.goal_id === goal.id && c.completed);
    return goalCheckins.length >= goal.duration_days;
  }).length;
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Calculate total check-ins
  const totalCheckins = checkins.filter(c => c.completed).length;

  // Get goal status
  const getGoalStatus = (goal: ChallengeGoal): "locked" | "active" | "completed" => {
    if (goal.id === effectiveCurrentGoalId) return "active";

    const goalCheckins = checkins.filter(c => c.goal_id === goal.id && c.completed);
    if (goalCheckins.length >= goal.duration_days) return "completed";

    // Check if this goal comes before the current one
    const currentGoalRef = allGoals.find(g => g.id === effectiveCurrentGoalId);
    if (currentGoalRef) {
      const currentIndex = allGoals.findIndex(g => g.id === currentGoalRef.id);
      const thisIndex = allGoals.findIndex(g => g.id === goal.id);
      if (thisIndex < currentIndex) {
        // Past goal that wasn't fully completed
        return "completed";
      }
    }

    return "locked";
  };

  // Get phase status
  const getPhaseStatus = (phase: ChallengePhase): "locked" | "active" | "completed" => {
    if (phase.id === effectiveCurrentPhaseId) return "active";

    const phaseGoals = phases.find(p => p.id === phase.id)?.goals || [];
    const completedCount = phaseGoals.filter(g => {
      const goalCheckins = checkins.filter(c => c.goal_id === g.id && c.completed);
      return goalCheckins.length >= g.duration_days;
    }).length;

    const threshold = (phase.completion_threshold / 100) * phaseGoals.length;
    if (completedCount >= threshold) return "completed";

    // Check order
    const currentPhaseRef = phases.find(p => p.id === effectiveCurrentPhaseId);
    if (currentPhaseRef && phase.order_index < currentPhaseRef.order_index) {
      return "completed";
    }

    return "locked";
  };

  // Toggle phase expansion
  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  // Handle check-in success
  const handleCheckinSuccess = useCallback(({ streak, achievements: newAchievements }: { streak: number; achievements: string[] }) => {
    // Show celebration for new achievements
    if (newAchievements.length > 0) {
      setCelebratingAchievement(newAchievements[0] as AchievementType);
    }

    // Refresh the page to get updated data
    setTimeout(() => {
      router.refresh();
    }, 1500);
  }, [router]);

  // Get current goal
  const currentGoal = allGoals.find(g => g.id === effectiveCurrentGoalId);

  // Get check-in progress for current goal
  const currentGoalCheckins = currentGoal
    ? checkins.filter(c => c.goal_id === currentGoal.id && c.completed).length
    : 0;

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparando seu desafio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achievement celebration modal */}
      {celebratingAchievement && (
        <AchievementCelebration
          achievement={celebratingAchievement}
          onClose={() => setCelebratingAchievement(null)}
        />
      )}

      {/* Challenge completed state - show at top if completed */}
      {participant.badge_earned && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="text-xl font-semibold text-emerald-800 text-balance">
            Desafio Concluído!
          </h3>
          <p className="mt-2 text-emerald-600 text-pretty">
            Parabéns! Você completou este desafio com sucesso.
          </p>
          {participant.completed_at && (
            <p className="mt-2 text-sm text-emerald-500">
              Completado em {format(new Date(participant.completed_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
      )}

      {/* 1. Current Goal Check-in Form - PRIMARY ACTION */}
      {currentGoal && !participant.badge_earned && (
        <div className="space-y-4">
          {/* Goal info header */}
          <div className="rounded-2xl border bg-card p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Target className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate">{currentGoal.title}</h3>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {currentGoalCheckins}/{currentGoal.duration_days} dias
                  </span>
                </div>
                {currentGoal.description && (
                  <p className="text-sm text-muted-foreground mt-1 text-pretty">
                    {currentGoal.description}
                  </p>
                )}
              </div>
            </div>

            {/* Progress for current goal */}
            <div className="space-y-2">
              <Progress
                value={(currentGoalCheckins / currentGoal.duration_days) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round((currentGoalCheckins / currentGoal.duration_days) * 100)}% completo
              </p>
            </div>
          </div>

          {/* Check-in form */}
          <GoalCheckinForm
            goal={currentGoal}
            participantId={participant.id}
            patientId={patientId}
            onSuccess={handleCheckinSuccess}
          />
        </div>
      )}

      {/* 2. Streak Display */}
      <StreakDisplay
        currentStreak={participant.streak_count}
        bestStreak={participant.best_streak}
        totalCheckins={totalCheckins}
      />

      {/* 3. Overall Progress */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progresso geral</span>
          <span className="text-sm font-medium tabular-nums">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {completedGoals} de {totalGoals} metas concluídas
        </p>
      </div>

      {/* 4. Phases & Goals */}
      {phases.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Fases do desafio</h3>

          {phases.map((phase) => {
            const phaseStatus = getPhaseStatus(phase);
            const isExpanded = expandedPhases.has(phase.id);
            const phaseGoals = phase.goals;
            const completedPhaseGoals = phaseGoals.filter(g => {
              const goalCheckins = checkins.filter(c => c.goal_id === g.id && c.completed);
              return goalCheckins.length >= g.duration_days;
            }).length;

            return (
              <div
                key={phase.id}
                className={cn(
                  "rounded-2xl border overflow-hidden",
                  phaseStatus === "active" && "border-primary/50 bg-primary/5",
                  phaseStatus === "completed" && "border-emerald-200 bg-emerald-50/50",
                  phaseStatus === "locked" && "border-muted bg-muted/30 opacity-60"
                )}
              >
                {/* Phase header */}
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                  disabled={phaseStatus === "locked"}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      phaseStatus === "active" && "bg-primary text-white",
                      phaseStatus === "completed" && "bg-emerald-500 text-white",
                      phaseStatus === "locked" && "bg-muted text-muted-foreground"
                    )}>
                      {phaseStatus === "completed" ? (
                        <CheckCircle2 className="size-5" />
                      ) : phaseStatus === "locked" ? (
                        <Lock className="size-4" />
                      ) : (
                        <span className="text-sm font-medium tabular-nums">{phase.order_index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{phase.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {completedPhaseGoals}/{phaseGoals.length} metas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {phaseStatus === "active" && (
                      <Badge variant="default" className="text-xs">
                        Ativa
                      </Badge>
                    )}
                    {phaseStatus !== "locked" && (
                      isExpanded ? (
                        <ChevronDown className="size-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-5 text-muted-foreground" />
                      )
                    )}
                  </div>
                </button>

                {/* Phase goals */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-2 space-y-2">
                    {phaseGoals.map((goal) => (
                      <GoalItem
                        key={goal.id}
                        goal={goal}
                        status={getGoalStatus(goal)}
                        checkins={checkins.filter(c => c.goal_id === goal.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Direct goals (no phases) */}
      {directGoals.length > 0 && phases.length === 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Metas do desafio</h3>
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            {directGoals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                status={getGoalStatus(goal)}
                checkins={checkins.filter(c => c.goal_id === goal.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <AchievementsDisplay achievements={achievements} />
    </div>
  );
}

// Goal item component
function GoalItem({
  goal,
  status,
  checkins,
}: {
  goal: ChallengeGoal;
  status: "locked" | "active" | "completed";
  checkins: GoalCheckin[];
}) {
  const Icon = GOAL_TYPE_ICONS[goal.type as GoalType];
  const completedCheckins = checkins.filter(c => c.completed).length;
  const progress = Math.round((completedCheckins / goal.duration_days) * 100);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl p-3 transition-colors",
        status === "active" && "bg-primary/10",
        status === "completed" && "bg-emerald-50",
        status === "locked" && "opacity-50"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          status === "active" && "bg-primary text-white",
          status === "completed" && "bg-emerald-500 text-white",
          status === "locked" && "bg-muted text-muted-foreground"
        )}
      >
        {status === "completed" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : status === "locked" ? (
          <Lock className="h-3 w-3" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium text-sm truncate",
            status === "locked" && "text-muted-foreground"
          )}
        >
          {goal.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{completedCheckins}/{goal.duration_days} dias</span>
          {status !== "locked" && (
            <>
              <span>•</span>
              <span>{progress}%</span>
            </>
          )}
        </div>
      </div>

      {status === "active" && (
        <Badge variant="default" className="text-xs shrink-0">
          Ativa
        </Badge>
      )}
    </div>
  );
}
