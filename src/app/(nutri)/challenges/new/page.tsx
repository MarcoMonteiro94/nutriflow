import { redirect } from "next/navigation";
import { getUserRole, isClinicalRole } from "@/lib/auth/authorization";
import { ChallengeFormV2 } from "../_components/challenge-form-v2";

export default async function NewChallengePage() {
  const userRole = await getUserRole();
  if (!userRole || !isClinicalRole(userRole.role)) {
    redirect("/schedule");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo Desafio</h1>
        <p className="text-muted-foreground">
          Crie um desafio com fases e metas para seus pacientes.
        </p>
      </div>

      <ChallengeFormV2 />
    </div>
  );
}
