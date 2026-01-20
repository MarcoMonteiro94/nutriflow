import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppointmentForm } from "../_components/appointment-form";
import type { Patient } from "@/types/database";

interface SearchParams {
  patient?: string;
  date?: string;
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

export default async function NewAppointmentPage({
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
          <Link href="/schedule">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Agendar Consulta
          </h1>
          <p className="text-muted-foreground">
            Agende um novo atendimento com um paciente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Atendimento</CardTitle>
          <CardDescription>
            Preencha as informações da consulta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentForm
            patients={patients}
            defaultPatientId={params.patient}
            defaultDate={params.date}
          />
        </CardContent>
      </Card>
    </div>
  );
}
