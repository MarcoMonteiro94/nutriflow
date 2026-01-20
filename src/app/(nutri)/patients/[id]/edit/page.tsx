import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { PatientForm } from "../../_components/patient-form";
import type { Patient } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) {
    return null;
  }

  return patient as Patient;
}

export default async function EditPatientPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/patients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Paciente
          </h1>
          <p className="text-muted-foreground">
            Atualize as informações de {patient.full_name}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
          <CardDescription>
            Atualize os dados do paciente. Campos com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm patient={patient} />
        </CardContent>
      </Card>
    </div>
  );
}
