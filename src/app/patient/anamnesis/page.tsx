import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { AnamnesisReport } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

async function getPatientAnamnesis(): Promise<{ reports: AnamnesisReport[]; patientId: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { reports: [], patientId: null };

  // Get patient record for this user
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!patient) return { reports: [], patientId: null };

  // RLS already filters to approved only for patient role
  const { data } = await supabase
    .from("anamnesis_reports")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return { reports: (data ?? []) as AnamnesisReport[], patientId: patient.id };
}

function getSourceTypeLabel(sourceType: string) {
  switch (sourceType) {
    case "audio": return "Áudio";
    case "text": return "Texto";
    case "hybrid": return "Híbrido";
    default: return sourceType;
  }
}

export default async function PatientAnamnesisPage() {
  const { reports, patientId } = await getPatientAnamnesis();

  if (!patientId) {
    redirect("/patient/dashboard");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minhas Anamneses</h1>
        <p className="text-muted-foreground">
          Histórico clínico e informações registradas pelo seu nutricionista.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma anamnese disponível
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Quando seu nutricionista registrar e aprovar uma anamnese, ela aparecerá aqui.
            </p>
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
                        : "Anamnese"}
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">
                        Aprovado
                      </Badge>
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
                    </CardDescription>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {report.goals && (report.goals as string[]).length > 0 && (
                      <span>
                        {(report.goals as string[]).length} objetivo{(report.goals as string[]).length > 1 ? "s" : ""} definido{(report.goals as string[]).length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/patient/anamnesis/${report.id}`}>
                      Ver Detalhes
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
