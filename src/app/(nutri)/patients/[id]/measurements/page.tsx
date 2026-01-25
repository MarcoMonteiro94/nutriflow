import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Ruler, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MeasurementsChart } from "./_components/measurements-chart";
import { MeasurementsList } from "./_components/measurements-list";
import { GoalSettingsDialog } from "./_components/goal-settings-dialog";
import { ProgressIndicators } from "./_components/progress-indicators";
import { ManageCustomTypesDialog } from "./_components/manage-custom-types-dialog";
import type { Measurement, Patient, MeasurementGoal, CustomMeasurementType, CustomMeasurementValue, MeasurementPhoto } from "@/types/database";
import { PhotoUpload } from "./_components/photo-upload";
import { PhotoComparison } from "./_components/photo-comparison";

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

async function getMeasurements(patientId: string): Promise<Measurement[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("measurements")
    .select("*")
    .eq("patient_id", patientId)
    .order("measured_at", { ascending: true });

  return (data ?? []) as Measurement[];
}

async function getMeasurementGoals(patientId: string): Promise<MeasurementGoal[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("measurement_goals")
    .select("*")
    .eq("patient_id", patientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (data ?? []) as MeasurementGoal[];
}

async function getCustomMeasurementTypes(): Promise<CustomMeasurementType[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("custom_measurement_types")
    .select("*")
    .eq("nutri_id", user.id)
    .order("name");

  return (data ?? []) as CustomMeasurementType[];
}

async function getCustomMeasurementValues(patientId: string): Promise<CustomMeasurementValue[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("custom_measurement_values")
    .select("*")
    .eq("patient_id", patientId)
    .order("measured_at", { ascending: true });

  return (data ?? []) as CustomMeasurementValue[];
}

async function getMeasurementPhotos(patientId: string): Promise<MeasurementPhoto[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("measurement_photos")
    .select("*")
    .eq("patient_id", patientId)
    .order("uploaded_at", { ascending: false });

  return (data ?? []) as MeasurementPhoto[];
}

function calculateChange(measurements: Measurement[], field: keyof Measurement): { value: number; trend: "up" | "down" | "stable" } | null {
  if (measurements.length < 2) return null;

  const recent = measurements[measurements.length - 1][field] as number | null;
  const previous = measurements[measurements.length - 2][field] as number | null;

  if (recent === null || previous === null) return null;

  const change = recent - previous;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";

  return { value: Math.abs(change), trend };
}

export default async function MeasurementsPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const measurements = await getMeasurements(id);
  const goals = await getMeasurementGoals(id);
  const customTypes = await getCustomMeasurementTypes();
  const customValues = await getCustomMeasurementValues(id);
  const photos = await getMeasurementPhotos(id);
  const latestMeasurement = measurements[measurements.length - 1];

  const weightChange = calculateChange(measurements, "weight");
  const bodyFatChange = calculateChange(measurements, "body_fat_percentage");

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
              Medidas de {patient.full_name}
            </h1>
            <p className="text-muted-foreground">
              Acompanhe a evolução antropométrica do paciente.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <ManageCustomTypesDialog />
          <GoalSettingsDialog patientId={id} />
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/patients/${id}/measurements/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Medida
            </Link>
          </Button>
        </div>
      </div>

      {/* Goal Progress Indicators */}
      <ProgressIndicators goals={goals} latestMeasurement={latestMeasurement} />

      {/* Current Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peso Atual</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMeasurement?.weight ? `${latestMeasurement.weight} kg` : "--"}
            </div>
            {weightChange && (
              <p className={`text-xs ${weightChange.trend === "down" ? "text-green-600" : weightChange.trend === "up" ? "text-red-600" : "text-muted-foreground"}`}>
                {weightChange.trend === "down" ? <TrendingDown className="inline h-3 w-3 mr-1" /> : weightChange.trend === "up" ? <TrendingUp className="inline h-3 w-3 mr-1" /> : null}
                {weightChange.value.toFixed(1)} kg desde última medida
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Gordura</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMeasurement?.body_fat_percentage ? `${latestMeasurement.body_fat_percentage}%` : "--"}
            </div>
            {bodyFatChange && (
              <p className={`text-xs ${bodyFatChange.trend === "down" ? "text-green-600" : bodyFatChange.trend === "up" ? "text-red-600" : "text-muted-foreground"}`}>
                {bodyFatChange.trend === "down" ? <TrendingDown className="inline h-3 w-3 mr-1" /> : bodyFatChange.trend === "up" ? <TrendingUp className="inline h-3 w-3 mr-1" /> : null}
                {bodyFatChange.value.toFixed(1)}% desde última medida
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Massa Muscular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMeasurement?.muscle_mass ? `${latestMeasurement.muscle_mass} kg` : "--"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cintura</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMeasurement?.waist_circumference ? `${latestMeasurement.waist_circumference} cm` : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução</CardTitle>
          <CardDescription>
            Acompanhe a evolução das medidas ao longo do tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementsChart measurements={measurements} customTypes={customTypes} customValues={customValues} goals={goals} />
        </CardContent>
      </Card>

      {/* Measurements History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Medidas</CardTitle>
          <CardDescription>
            {measurements.length === 0
              ? "Nenhuma medida registrada ainda"
              : `${measurements.length} medida${measurements.length > 1 ? "s" : ""} registrada${measurements.length > 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementsList measurements={measurements} patientId={id} customTypes={customTypes} customValues={customValues} />
        </CardContent>
      </Card>

      {/* Progress Photos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PhotoUpload patientId={id} />
        <Card>
          <CardHeader>
            <CardTitle>Galeria de Fotos</CardTitle>
            <CardDescription>
              {photos.length === 0
                ? "Nenhuma foto registrada ainda"
                : `${photos.length} foto${photos.length > 1 ? "s" : ""} registrada${photos.length > 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoComparison photos={photos} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
