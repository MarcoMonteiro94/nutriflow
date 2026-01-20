import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MeasurementForm } from "../_components/measurement-form";
import type { Patient } from "@/types/database";

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

export default async function NewMeasurementPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

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
            Nova Medida
          </h1>
          <p className="text-muted-foreground">
            Registre as medidas de {patient.full_name}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados Antropométricos</CardTitle>
          <CardDescription>
            Preencha as medidas disponíveis. Campos em branco serão ignorados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementForm patientId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
