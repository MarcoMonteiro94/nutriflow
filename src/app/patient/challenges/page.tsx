import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PatientChallengesList } from "./_components/patient-challenges-list";
import type { Challenge, ChallengeParticipant, ChallengeCheckin } from "@/types/database";

type ParticipantWithChallenge = ChallengeParticipant & {
  challenge: Challenge;
  checkins: ChallengeCheckin[];
};

async function getPatientChallenges(): Promise<ParticipantWithChallenge[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get patient record
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) {
    return [];
  }

  // Get challenges the patient is participating in
  const { data: participations } = await supabase
    .from("challenge_participants")
    .select(
      `
      *,
      challenge:challenges(*),
      checkins:challenge_checkins(*)
    `
    )
    .eq("patient_id", patient.id);

  if (!participations) return [];

  // Filter only active or completed challenges
  const filtered = participations.filter((p) => {
    const challenge = p.challenge as Challenge | null;
    return challenge && (challenge.status === "active" || challenge.status === "completed");
  }) as ParticipantWithChallenge[];

  return filtered;
}

export default async function PatientChallengesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const participations = await getPatientChallenges();

  const activeChallenges = participations.filter(
    (p) => p.challenge.status === "active"
  );
  const completedChallenges = participations.filter(
    (p) => p.challenge.status === "completed" || p.badge_earned
  );

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Meus Desafios
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Acompanhe seu progresso nos desafios propostos pelo seu nutricionista.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <PatientChallengesList
          participations={participations}
          stats={{
            total: participations.length,
            active: activeChallenges.length,
            completed: completedChallenges.length,
          }}
        />
      </div>
    </div>
  );
}
