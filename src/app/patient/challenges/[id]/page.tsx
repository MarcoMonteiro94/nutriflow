import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Trophy, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { format, differenceInDays, isAfter, isBefore, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckinCalendar } from "../_components/checkin-calendar";
import { ChallengeBadge } from "../_components/challenge-badge";
import type { Challenge, ChallengeParticipant, ChallengeCheckin } from "@/types/database";

type ParticipantWithDetails = ChallengeParticipant & {
  challenge: Challenge;
  checkins: ChallengeCheckin[];
};

async function getParticipation(challengeId: string): Promise<ParticipantWithDetails | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get patient record
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) return null;

  // Get participation with challenge and checkins
  const { data } = await supabase
    .from("challenge_participants")
    .select(
      `
      *,
      challenge:challenges(*),
      checkins:challenge_checkins(*)
    `
    )
    .eq("patient_id", patient.id)
    .eq("challenge_id", challengeId)
    .single();

  return data as ParticipantWithDetails | null;
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

  const { id } = await params;
  const participation = await getParticipation(id);

  if (!participation) {
    notFound();
  }

  const { challenge, checkins, badge_earned } = participation;
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  const now = new Date();
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const daysPassed = isAfter(now, startDate)
    ? Math.min(differenceInDays(now, startDate) + 1, totalDays)
    : 0;
  const checkinRate = daysPassed > 0
    ? Math.round((checkins.length / daysPassed) * 100)
    : 0;
  const overallProgress = Math.round((checkins.length / totalDays) * 100);

  const isActive =
    challenge.status === "active" &&
    isAfter(now, startDate) &&
    isBefore(now, endDate);

  // Get today's checkin status
  const todayStr = format(now, "yyyy-MM-dd");
  const todayCheckin = checkins.find((c) => c.checkin_date === todayStr);

  // Get all days in the challenge period
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const checkinDates = new Set(checkins.map((c) => c.checkin_date));

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

      {/* Content */}
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
