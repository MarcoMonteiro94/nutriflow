import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ruler, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EvolutionChart, type UnifiedDataPoint } from "./_components/evolution-chart";
import { EvolutionTimeline } from "./_components/evolution-timeline";
import type { Measurement, AnthropometryAssessment, Patient } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("nutri_id", user.id)
    .single();

  return data as Patient | null;
}

async function getMeasurements(patientId: string): Promise<Measurement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("measurements")
    .select("*")
    .eq("patient_id", patientId)
    .order("measured_at", { ascending: true });

  return (data ?? []) as Measurement[];
}

async function getAnthropometry(patientId: string): Promise<AnthropometryAssessment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("anthropometry_assessments")
    .select("*")
    .eq("patient_id", patientId)
    .order("assessed_at", { ascending: true });

  return (data ?? []) as AnthropometryAssessment[];
}

function unifyData(
  measurements: Measurement[],
  assessments: AnthropometryAssessment[]
): { points: UnifiedDataPoint[]; recordIds: Record<string, string> } {
  const recordIds: Record<string, string> = {};
  const points: UnifiedDataPoint[] = [];

  for (const m of measurements) {
    const key = `measurement-${m.measured_at}`;
    recordIds[key] = m.id;
    points.push({
      date: m.measured_at,
      weight: m.weight,
      body_fat: m.body_fat_percentage,
      muscle_mass: m.muscle_mass,
      waist: m.waist_circumference,
      hip: m.hip_circumference,
      source: "measurement",
    });
  }

  for (const a of assessments) {
    const key = `anthropometry-${a.assessed_at}`;
    recordIds[key] = a.id;
    points.push({
      date: a.assessed_at,
      weight: a.weight,
      bmi: a.bmi,
      body_fat: a.body_fat_percentage,
      waist: a.waist_circumference,
      hip: a.hip_circumference,
      source: "anthropometry",
    });
  }

  points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { points, recordIds };
}

export default async function EvolutionPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const [measurements, assessments] = await Promise.all([
    getMeasurements(id),
    getAnthropometry(id),
  ]);

  const { points } = unifyData(measurements, assessments);
  const totalRecords = measurements.length + assessments.length;

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
              Evolução Corporal
            </h1>
            <p className="text-muted-foreground">
              Visão unificada de medidas e antropometria de {patient.full_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/patients/${id}/measurements/new`}>
              <Scale className="mr-2 h-4 w-4" />
              Nova Medida
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/patients/${id}/anthropometry/new`}>
              <Ruler className="mr-2 h-4 w-4" />
              Nova Antropometria
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total de Registros</p>
            <p className="text-2xl font-semibold">{totalRecords}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {measurements.length} medidas + {assessments.length} antropometrias
            </p>
          </CardContent>
        </Card>
        {points.length > 0 && points[points.length - 1].weight && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Último Peso</p>
              <p className="text-2xl font-semibold">{points[points.length - 1].weight}kg</p>
              {points.length > 1 && points[0].weight && (
                <p className="text-xs text-muted-foreground mt-1">
                  Inicial: {points[0].weight}kg ({((points[points.length - 1].weight! - points[0].weight!) >= 0 ? "+" : "")}{(points[points.length - 1].weight! - points[0].weight!).toFixed(1)}kg)
                </p>
              )}
            </CardContent>
          </Card>
        )}
        {points.length > 0 && points[points.length - 1].body_fat && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Último % Gordura</p>
              <p className="text-2xl font-semibold">{points[points.length - 1].body_fat}%</p>
              {points.length > 1 && points[0].body_fat && (
                <p className="text-xs text-muted-foreground mt-1">
                  Inicial: {points[0].body_fat}% ({((points[points.length - 1].body_fat! - points[0].body_fat!) >= 0 ? "+" : "")}{(points[points.length - 1].body_fat! - points[0].body_fat!).toFixed(1)}pp)
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Unified Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Evolução</CardTitle>
          <CardDescription>
            Dados combinados de medidas de acompanhamento e avaliações antropométricas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvolutionChart data={points} />
        </CardContent>
      </Card>

      {/* Unified Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Completo</CardTitle>
          <CardDescription>
            {totalRecords === 0
              ? "Nenhum registro encontrado"
              : `${totalRecords} registro${totalRecords > 1 ? "s" : ""} ordenado${totalRecords > 1 ? "s" : ""} por data`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvolutionTimeline data={points} patientId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
