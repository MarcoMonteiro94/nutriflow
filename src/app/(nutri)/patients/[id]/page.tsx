import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Mail,
  Phone,
  Target,
  UtensilsCrossed,
  Activity,
  FileText,
  Ruler
} from "lucide-react";
import { DeletePatientButton } from "../_components/delete-patient-button";
import { SharePlanButton } from "./_components/share-plan-button";
import { createPatientToken } from "@/lib/patient-token";
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

async function getPatientStats(patientId: string) {
  const supabase = await createClient();

  const { count: mealPlansCount } = await supabase
    .from("meal_plans")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const { count: appointmentsCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const { count: measurementsCount } = await supabase
    .from("measurements")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const { count: anamnesisCount } = await supabase
    .from("anamnesis_reports")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const { count: anthropometryCount } = await supabase
    .from("anthropometry_assessments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId);

  return {
    mealPlans: mealPlansCount ?? 0,
    appointments: appointmentsCount ?? 0,
    measurements: measurementsCount ?? 0,
    anamnesis: anamnesisCount ?? 0,
    anthropometry: anthropometryCount ?? 0,
  };
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const stats = await getPatientStats(id);

  async function generateToken() {
    "use server";
    return await createPatientToken(id);
  }

  const initials = patient.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const age = patient.birth_date
    ? Math.floor(
        (new Date().getTime() - new Date(patient.birth_date).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Perfil do Paciente
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie as informações do paciente.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href={`/patients/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DeletePatientButton patientId={id} patientName={patient.full_name} />
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{patient.full_name}</CardTitle>
              <CardDescription>
                {age !== null && `${age} anos`}
                {age !== null && patient.gender && " • "}
                {patient.gender && `${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{patient.email}</p>
                </div>
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p>{patient.phone}</p>
                </div>
              </div>
            )}
            {patient.birth_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                  <p>
                    {new Date(patient.birth_date).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
            {patient.goal && (
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Objetivo</p>
                  <p>{patient.goal}</p>
                </div>
              </div>
            )}
            {patient.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Observações</p>
                <p className="text-sm">{patient.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Planos Alimentares
              </CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mealPlans}</div>
              <Button asChild variant="link" className="h-auto p-0 text-xs">
                <Link href={`/plans?patient=${id}`}>Ver planos →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Consultas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appointments}</div>
              <Button asChild variant="link" className="h-auto p-0 text-xs">
                <Link href={`/patients/${id}/appointments`}>
                  Ver histórico →
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Medidas Registradas
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.measurements}</div>
              <Button asChild variant="link" className="h-auto p-0 text-xs">
                <Link href={`/patients/${id}/measurements`}>
                  Ver evolução →
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Anamneses
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.anamnesis}</div>
              <Button asChild variant="link" className="h-auto p-0 text-xs">
                <Link href={`/patients/${id}/anamnesis`}>
                  Ver anamneses →
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Antropometria
              </CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.anthropometry}</div>
              <Button asChild variant="link" className="h-auto p-0 text-xs">
                <Link href={`/patients/${id}/anthropometry`}>
                  Ver avaliações →
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as funções relacionadas a este paciente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/plans/new?patient=${id}`}>
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Criar Novo Plano
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/schedule/new?patient=${id}`}>
              <Calendar className="mr-2 h-4 w-4" />
              Agendar Consulta
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/patients/${id}/measurements/new`}>
              <Activity className="mr-2 h-4 w-4" />
              Registrar Medidas
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/patients/${id}/anamnesis/new`}>
              <FileText className="mr-2 h-4 w-4" />
              Nova Anamnese
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/patients/${id}/anthropometry/new`}>
              <Ruler className="mr-2 h-4 w-4" />
              Nova Antropometria
            </Link>
          </Button>
          <SharePlanButton
            patientId={id}
            patientName={patient.full_name}
            generateToken={generateToken}
          />
        </CardContent>
      </Card>
    </div>
  );
}
