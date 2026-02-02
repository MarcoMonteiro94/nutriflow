import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserRole, isClinicalRole } from "@/lib/auth/authorization";
import { ChallengeForm } from "../_components/challenge-form";

export default async function NewChallengePage() {
  const userRole = await getUserRole();
  if (!userRole || !isClinicalRole(userRole.role)) {
    redirect("/schedule");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo Desafio</h1>
        <p className="text-muted-foreground">
          Crie um desafio para motivar seus pacientes.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Informações do Desafio</CardTitle>
          <CardDescription>
            Defina o título, descrição e período do desafio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChallengeForm />
        </CardContent>
      </Card>
    </div>
  );
}
