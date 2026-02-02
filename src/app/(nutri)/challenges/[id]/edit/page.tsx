import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isClinicalRole } from "@/lib/auth/authorization";
import { ChallengeForm } from "../../_components/challenge-form";
import type { Challenge } from "@/types/database";

async function getChallenge(id: string): Promise<Challenge | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .eq("nutri_id", user.id)
    .single();

  return data as Challenge | null;
}

export default async function EditChallengePage({
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 px-4 sm:px-6 lg:px-8">
      <div>
        <Link
          href={`/challenges/${challenge.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Desafio
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar Desafio</h1>
        <p className="text-muted-foreground">
          Atualize as informações do desafio.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Informações do Desafio</CardTitle>
          <CardDescription>
            Modifique o título, descrição ou período do desafio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChallengeForm challenge={challenge} />
        </CardContent>
      </Card>
    </div>
  );
}
