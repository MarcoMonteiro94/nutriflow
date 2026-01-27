import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MeasurementForm } from "../../_components/measurement-form";
import type { Patient, Measurement } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string; measurementId: string }>;
}

async function getMeasurement(
  patientId: string,
  measurementId: string
): Promise<{ measurement: Measurement; patient: Patient } | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch patient with nutri_id check
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("nutri_id", user.id)
    .single();

  if (!patient) {
    return null;
  }

  // Fetch measurement with patient_id check
  const { data: measurement } = await supabase
    .from("measurements")
    .select("*")
    .eq("id", measurementId)
    .eq("patient_id", patientId)
    .single();

  if (!measurement) {
    return null;
  }

  return {
    measurement: measurement as Measurement,
    patient: patient as Patient,
  };
}

export default async function EditMeasurementPage({ params }: PageProps) {
  const { id, measurementId } = await params;
  const result = await getMeasurement(id, measurementId);

  if (!result) {
    notFound();
  }

  const { measurement, patient } = result;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/patients/${id}/measurements`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Medida
          </h1>
          <p className="text-muted-foreground">
            Atualize as medidas de {patient.full_name}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados Antropométricos</CardTitle>
          <CardDescription>
            Atualize as medidas disponíveis. Campos em branco serão ignorados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementForm
            patientId={id}
            measurementId={measurementId}
            initialData={measurement}
          />
        </CardContent>
      </Card>
    </div>
  );
}
