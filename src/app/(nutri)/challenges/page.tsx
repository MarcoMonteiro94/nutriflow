import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isClinicalRole } from "@/lib/auth/authorization";
import { ChallengesList } from "./_components/challenges-list";
import type { Challenge, ChallengeParticipant, Patient } from "@/types/database";

type ChallengeWithStats = Challenge & {
  participants: (ChallengeParticipant & { patient: Patient })[];
  _count: {
    participants: number;
    checkins: number;
  };
};

async function getChallenges(): Promise<ChallengeWithStats[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: challenges } = await supabase
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
    .eq("nutri_id", user.id)
    .order("created_at", { ascending: false });

  if (!challenges) return [];

  return challenges.map((challenge) => {
    const typedChallenge = challenge as Challenge & {
      participants: (ChallengeParticipant & { patient: Patient; checkins: unknown[] })[];
    };
    return {
      ...typedChallenge,
      _count: {
        participants: typedChallenge.participants?.length ?? 0,
        checkins:
          typedChallenge.participants?.reduce(
            (acc: number, p) => acc + (p.checkins?.length ?? 0),
            0
          ) ?? 0,
      },
    };
  }) as ChallengeWithStats[];
}

export default async function ChallengesPage() {
  const userRole = await getUserRole();
  if (!userRole || !isClinicalRole(userRole.role)) {
    redirect("/schedule");
  }

  const challenges = await getChallenges();

  const now = new Date();
  const activeChallenges = challenges.filter((c) => c.status === "active");
  const completedChallenges = challenges.filter((c) => c.status === "completed");
  const totalParticipants = challenges.reduce(
    (acc, c) => acc + c._count.participants,
    0
  );

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-card via-card to-primary/[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/[0.03] to-transparent blur-3xl" />

        <div className="relative px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    Desafios
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                    Crie desafios para motivar seus pacientes e acompanhe o
                    progresso deles em tempo real.
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-full h-11 px-6 gap-2 shrink-0">
                <Link href="/challenges/new">
                  <Plus className="h-4 w-4" />
                  Novo Desafio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="max-w-6xl mx-auto">
          <ChallengesList
            challenges={challenges}
            stats={{
              total: challenges.length,
              active: activeChallenges.length,
              completed: completedChallenges.length,
              participants: totalParticipants,
            }}
          />
        </div>
      </div>
    </div>
  );
}
