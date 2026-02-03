import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FileText, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Patient, AnamnesisReport } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

async function getAnamnesisReports(patientId: string): Promise<AnamnesisReport[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("anamnesis_reports")
    .select("*")
    .eq("patient_id", patientId)
    .eq("nutri_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as AnamnesisReport[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Rascunho</Badge>;
    case "processing":
      return <Badge variant="outline">Processando</Badge>;
    case "review":
      return <Badge variant="default">Em Revisão</Badge>;
    case "approved":
      return <Badge className="bg-green-500 hover:bg-green-600">Aprovado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getSourceTypeLabel(sourceType: string) {
  switch (sourceType) {
    case "audio":
      return "Áudio";
    case "text":
      return "Texto";
    case "hybrid":
      return "Híbrido";
    default:
      return sourceType;
  }
}

export default async function AnamnesisListPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const reports = await getAnamnesisReports(id);

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
              Anamneses de {patient.full_name}
            </h1>
            <p className="text-muted-foreground">
              Registros de anamnese processados com IA
            </p>
          </div>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/patients/${id}/anamnesis/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Anamnese
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma anamnese registrada
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece gravando ou digitando uma anamnese para este paciente.
            </p>
            <Button asChild>
              <Link href={`/patients/${id}/anamnesis/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Anamnese
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {report.chief_complaint
                        ? report.chief_complaint.slice(0, 60) +
                          (report.chief_complaint.length > 60 ? "..." : "")
                        : "Anamnese sem queixa principal"}
                      {getStatusBadge(report.status)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(report.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      <span>Fonte: {getSourceTypeLabel(report.source_type)}</span>
                      {report.confidence_score && (
                        <span>
                          Confiança: {Math.round(report.confidence_score * 100)}%
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {report.status === "approved" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {report.goals && (report.goals as string[]).length > 0 && (
                      <span>
                        {(report.goals as string[]).length} objetivo
                        {(report.goals as string[]).length > 1 ? "s" : ""} definido
                        {(report.goals as string[]).length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/patients/${id}/anamnesis/${report.id}`}>
                      {report.status === "review" ? "Revisar" : "Ver Detalhes"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
