import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MealPlanForm } from "../_components/meal-plan-form";
import type { Patient } from "@/types/database";

interface SearchParams {
  patient?: string;
}

async function getPatients(): Promise<Patient[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("nutri_id", user.id)
    .order("full_name", { ascending: true });

  return (data ?? []) as Patient[];
}

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const patients = await getPatients();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/plans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo Plano Alimentar
          </h1>
          <p className="text-muted-foreground">
            Crie um novo plano alimentar para um paciente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Plano</CardTitle>
          <CardDescription>
            Defina as informações básicas do plano. Você poderá adicionar refeições após criar o plano.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealPlanForm
            patients={patients}
            defaultPatientId={params.patient}
          />
        </CardContent>
      </Card>
    </div>
  );
}
