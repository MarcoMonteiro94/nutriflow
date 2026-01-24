import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnthropometryCharts } from "./_components/anthropometry-charts";
import { AnthropometryList } from "./_components/anthropometry-list";
import { BodyCompositionCard } from "./_components/body-composition-card";
import type { AnthropometryAssessment, Patient } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("nutri_id", user.id)
    .single();

  return data as Patient | null;
}

async function getAnthropometryAssessments(patientId: string): Promise<AnthropometryAssessment[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("anthropometry_assessments")
    .select("*")
    .eq("patient_id", patientId)
    .order("assessed_at", { ascending: true });

  return (data ?? []) as AnthropometryAssessment[];
}

export default async function AnthropometryPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const assessments = await getAnthropometryAssessments(id);
  const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;
  const previousAssessment = assessments.length > 1 ? assessments[assessments.length - 2] : null;

  // Determine patient sex for body fat classification
  const patientSex = patient.gender === "male" || patient.gender === "masculino"
    ? "male"
    : patient.gender === "female" || patient.gender === "feminino"
      ? "female"
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/patients/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Antropometria de {patient.full_name}
            </h1>
            <p className="text-muted-foreground">
              Acompanhe a avaliação antropométrica completa do paciente.
            </p>
          </div>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/patients/${id}/anthropometry/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Avaliação
          </Link>
        </Button>
      </div>

      {/* Current Stats */}
      <BodyCompositionCard
        latestAssessment={latestAssessment}
        previousAssessment={previousAssessment}
        patientSex={patientSex}
      />

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução</CardTitle>
          <CardDescription>
            Acompanhe a evolução das medidas antropométricas ao longo do tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnthropometryCharts assessments={assessments} />
        </CardContent>
      </Card>

      {/* Assessments History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Avaliações</CardTitle>
          <CardDescription>
            {assessments.length === 0
              ? "Nenhuma avaliação registrada ainda"
              : `${assessments.length} avaliação${assessments.length > 1 ? "ões" : ""} registrada${assessments.length > 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnthropometryList assessments={assessments} patientId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
