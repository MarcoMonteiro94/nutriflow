import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Play,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isClinicalRole } from "@/lib/auth/authorization";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ParticipantsList } from "../_components/participants-list";
import { ChallengeActions } from "../_components/challenge-actions";
import type { Challenge, ChallengeParticipant, ChallengeCheckin, Patient } from "@/types/database";

type ParticipantWithDetails = ChallengeParticipant & {
  patient: Patient;
  checkins: ChallengeCheckin[];
};

type ChallengeWithParticipants = Challenge & {
  participants: ParticipantWithDetails[];
};

async function getChallenge(id: string): Promise<ChallengeWithParticipants | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("challenges")
    .select(
      `
      *,
      participants:challenge_participants(
        *,
        patient:patients(*),
        checkins:challenge_checkins(*)
      )
    `
    )
    .eq("id", id)
    .eq("nutri_id", user.id)
    .single();

  return data as ChallengeWithParticipants | null;
}

async function getAvailablePatients(challengeId: string): Promise<Patient[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get patients that are not already in this challenge
  const { data: existingParticipants } = await supabase
    .from("challenge_participants")
    .select("patient_id")
    .eq("challenge_id", challengeId);

  const existingPatientIds = existingParticipants?.map((p) => p.patient_id) ?? [];

  let query = supabase
    .from("patients")
    .select("*")
    .eq("nutri_id", user.id)
    .order("full_name");

  if (existingPatientIds.length > 0) {
    query = query.not("id", "in", `(${existingPatientIds.join(",")})`);
  }

  const { data } = await query;
  return (data ?? []) as Patient[];
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
      color: "text-destructive",
    };
  }

  if (challenge.status === "completed" || isAfter(now, endDate)) {
    return {
      label: "Concluído",
      variant: "secondary" as const,
      icon: CheckCircle2,
      color: "text-muted-foreground",
    };
  }

  if (challenge.status === "active" && isBefore(now, endDate) && isAfter(now, startDate)) {
    return {
      label: "Ativo",
      variant: "default" as const,
      icon: Play,
      color: "text-emerald-600",
    };
  }

  if (isBefore(now, startDate)) {
    return {
      label: "Agendado",
      variant: "outline" as const,
      icon: Clock,
      color: "text-amber-600",
    };
  }

  return {
    label: "Rascunho",
    variant: "outline" as const,
    icon: null,
    color: "text-muted-foreground",
  };
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userRole = await getUserRole();
  if (!userRole || !isClinicalRole(userRole.role)) {
    redirect("/schedule");
  }

  const { id } = await params;
  const challenge = await getChallenge(id);

  if (!challenge) {
    notFound();
  }

  const availablePatients = await getAvailablePatients(id);
  const statusConfig = getStatusConfig(challenge);

  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const now = new Date();

  let progress = 0;
  let daysRemaining = 0;
  if (isAfter(now, startDate)) {
    const daysPassed = differenceInDays(now, startDate) + 1;
    progress = Math.min((daysPassed / totalDays) * 100, 100);
    daysRemaining = Math.max(differenceInDays(endDate, now), 0);
  } else {
    daysRemaining = totalDays;
  }

  const totalCheckins = challenge.participants.reduce(
    (acc, p) => acc + p.checkins.length,
    0
  );
  const expectedCheckins = challenge.participants.length * Math.min(
    differenceInDays(now, startDate) + 1,
    totalDays
  );
  const completionRate = expectedCheckins > 0
    ? Math.round((totalCheckins / expectedCheckins) * 100)
    : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Back button */}
            <Link
              href="/challenges"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Desafios
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {challenge.title}
                  </h1>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.icon && (
                      <statusConfig.icon className="h-3 w-3 mr-1" />
                    )}
                    {statusConfig.label}
                  </Badge>
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
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{challenge.participants.length} participantes</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/challenges/${challenge.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
                <ChallengeActions challenge={challenge} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Stats */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border bg-card p-4 shadow-soft">
                <p className="text-sm text-muted-foreground">Dias totais</p>
                <p className="text-2xl font-semibold mt-1">{totalDays}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-soft">
                <p className="text-sm text-muted-foreground">Dias restantes</p>
                <p className="text-2xl font-semibold mt-1">{daysRemaining}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-soft">
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-2xl font-semibold mt-1">{Math.round(progress)}%</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-soft">
                <p className="text-sm text-muted-foreground">Taxa de check-in</p>
                <p className="text-2xl font-semibold mt-1">{completionRate}%</p>
              </div>
            </div>

            {/* Participants */}
            <div className="lg:col-span-3">
              <ParticipantsList
                challengeId={challenge.id}
                participants={challenge.participants}
                availablePatients={availablePatients}
                totalDays={totalDays}
                startDate={startDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
