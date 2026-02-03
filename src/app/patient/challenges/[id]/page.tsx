import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Trophy, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { format, differenceInDays, isAfter, isBefore, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckinCalendar } from "../_components/checkin-calendar";
import { ChallengeBadge } from "../_components/challenge-badge";
import { V2ChallengeView } from "../_components/v2-challenge-view";
import type {
  Challenge,
  ChallengeParticipant,
  ChallengeCheckin,
  ChallengeParticipantV2,
  ChallengePhase,
  ChallengeGoal,
  GoalCheckin,
  ParticipantAchievement,
} from "@/types/database";

// V1 participant type
type ParticipantWithDetails = ChallengeParticipant & {
  challenge: Challenge;
  checkins: ChallengeCheckin[];
};

// V2 participant type with phases and goals
type V2ParticipantWithDetails = ChallengeParticipantV2 & {
  challenge: Challenge;
};

async function getPatientId(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", userId)
    .single();

  return patient?.id || null;
}

async function getParticipation(challengeId: string, patientId: string): Promise<ParticipantWithDetails | null> {
  const supabase = await createClient();

  // Get participation with challenge and checkins (V1)
  const { data } = await supabase
    .from("challenge_participants")
    .select(
      `
      *,
      challenge:challenges(*),
      checkins:challenge_checkins(*)
    `
    )
    .eq("patient_id", patientId)
    .eq("challenge_id", challengeId)
    .single();

  return data as ParticipantWithDetails | null;
}

async function isV2Challenge(challengeId: string): Promise<boolean> {
  const supabase = await createClient();

  // Check if challenge has any goals (V2 indicator)
  const { count } = await (supabase as any)
    .from("challenge_goals")
    .select("id", { count: "exact", head: true })
    .eq("challenge_id", challengeId);

  return (count ?? 0) > 0;
}

async function getV2Data(challengeId: string, participantId: string) {
  const supabase = await createClient();

  // Get phases with their goals
  const { data: phases } = await (supabase as any)
    .from("challenge_phases")
    .select("*, goals:challenge_goals(*)")
    .eq("challenge_id", challengeId)
    .order("order_index", { ascending: true });

  // Get direct goals (no phase)
  const { data: directGoals } = await (supabase as any)
    .from("challenge_goals")
    .select("*")
    .eq("challenge_id", challengeId)
    .is("phase_id", null)
    .order("order_index", { ascending: true });

  // Get all goal IDs for this challenge
  const allGoalIds = [
    ...(phases?.flatMap((p: any) => p.goals?.map((g: any) => g.id) || []) || []),
    ...(directGoals?.map((g: any) => g.id) || []),
  ];

  // Get all checkins for these goals
  const { data: checkins } = await (supabase as any)
    .from("goal_checkins")
    .select("*")
    .eq("participant_id", participantId)
    .in("goal_id", allGoalIds.length > 0 ? allGoalIds : ["no-goals"]);

  // Get achievements
  const { data: achievements } = await (supabase as any)
    .from("participant_achievements")
    .select("*")
    .eq("participant_id", participantId)
    .order("earned_at", { ascending: false });

  return {
    phases: (phases || []) as (ChallengePhase & { goals: ChallengeGoal[] })[],
    directGoals: (directGoals || []) as ChallengeGoal[],
    checkins: (checkins || []) as GoalCheckin[],
    achievements: (achievements || []) as ParticipantAchievement[],
  };
}

export default async function PatientChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id: challengeId } = await params;

  // Get patient ID
  const patientId = await getPatientId(user.id);
  if (!patientId) {
    notFound();
  }

  // Get participation
  const participation = await getParticipation(challengeId, patientId);
  if (!participation) {
    notFound();
  }

  // Check if V2 challenge
  const isV2 = await isV2Challenge(challengeId);

  const { challenge, badge_earned } = participation;
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  const now = new Date();

  const isActive =
    challenge.status === "active" &&
    isAfter(now, startDate) &&
    isBefore(now, endDate);

  // V2 Challenge rendering
  if (isV2) {
    const v2Data = await getV2Data(challengeId, participation.id);

    // Cast participant to V2 type with defaults for new fields
    const v2Participant: ChallengeParticipantV2 = {
      ...participation,
      current_phase_id: (participation as any).current_phase_id || null,
      current_goal_id: (participation as any).current_goal_id || null,
      streak_count: (participation as any).streak_count || 0,
      best_streak: (participation as any).best_streak || 0,
    };

    return (
      <div className="min-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <Link
              href="/patient/challenges"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {challenge.title}
                  </h1>
                  {badge_earned && (
                    <Badge variant="default" className="gap-1">
                      <Award className="h-3 w-3" />
                      Concluído
                    </Badge>
                  )}
                </div>
                {challenge.description && (
                  <p className="text-muted-foreground max-w-2xl">
                    {challenge.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(startDate, "d MMM", { locale: ptBR })} -{" "}
                      {format(endDate, "d MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* V2 Content */}
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <V2ChallengeView
              challenge={challenge}
              participant={v2Participant}
              phases={v2Data.phases}
              directGoals={v2Data.directGoals}
              checkins={v2Data.checkins}
              achievements={v2Data.achievements}
              patientId={patientId}
            />
          </div>
        </div>
      </div>
    );
  }

  // V1 Challenge rendering (original code)
  const { checkins } = participation;
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const daysPassed = isAfter(now, startDate)
    ? Math.min(differenceInDays(now, startDate) + 1, totalDays)
    : 0;
  const checkinRate = daysPassed > 0
    ? Math.round((checkins.length / daysPassed) * 100)
    : 0;
  const overallProgress = Math.round((checkins.length / totalDays) * 100);

  // Get today's checkin status
  const todayStr = format(now, "yyyy-MM-dd");
  const todayCheckin = checkins.find((c) => c.checkin_date === todayStr);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/patient/challenges"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {challenge.title}
                </h1>
                {badge_earned && (
                  <Badge variant="default" className="gap-1">
                    <Award className="h-3 w-3" />
                    Concluído
                  </Badge>
                )}
              </div>
              {challenge.description && (
                <p className="text-muted-foreground max-w-2xl">
                  {challenge.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(startDate, "d MMM", { locale: ptBR })} -{" "}
                    {format(endDate, "d MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* V1 Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Badge Display (if earned) */}
          {badge_earned && (
            <ChallengeBadge
              title={challenge.title}
              completedAt={participation.completed_at}
            />
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border bg-card p-4 shadow-soft text-center">
              <p className="text-2xl font-semibold">{totalDays}</p>
              <p className="text-xs text-muted-foreground">Dias totais</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-soft text-center">
              <p className="text-2xl font-semibold">{checkins.length}</p>
              <p className="text-xs text-muted-foreground">Check-ins feitos</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-soft text-center">
              <p className="text-2xl font-semibold">{checkinRate}%</p>
              <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-soft text-center">
              <p className="text-2xl font-semibold">{overallProgress}%</p>
              <p className="text-xs text-muted-foreground">Progresso geral</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso do desafio</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {checkins.length} de {totalDays} dias completados
            </p>
          </div>

          {/* Checkin Calendar */}
          <CheckinCalendar
            participantId={participation.id}
            challengeId={challenge.id}
            startDate={startDate}
            endDate={endDate}
            checkins={checkins}
            isActive={isActive}
            todayCheckin={todayCheckin}
          />
        </div>
      </div>
    </div>
  );
}
