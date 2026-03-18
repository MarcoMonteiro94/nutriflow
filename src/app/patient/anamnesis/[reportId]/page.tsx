import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AnamnesisReport } from "@/types/database";
import type { SocialHistory, DietaryHistory } from "@/types/anamnesis";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

async function getReport(reportId: string): Promise<AnamnesisReport | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get patient ID for this user
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!patient) return null;

  // RLS ensures only approved reports are visible
  const { data } = await supabase
    .from("anamnesis_reports")
    .select("*")
    .eq("id", reportId)
    .eq("patient_id", patient.id)
    .eq("status", "approved")
    .single();

  return data as AnamnesisReport | null;
}

function ListSection({ label, items }: { label: string; items: string[] | null | undefined }) {
  const list = (items as string[]) ?? [];
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {list.length > 0 ? (
        <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground mt-1">Não informado</p>
      )}
    </div>
  );
}

function TextSection({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm mt-1">{value || "Não informado"}</p>
    </div>
  );
}

export default async function PatientAnamnesisDetailPage({ params }: PageProps) {
  const { reportId } = await params;
  const report = await getReport(reportId);

  if (!report) {
    notFound();
  }

  const socialHistory = report.social_history as SocialHistory | null;
  const dietaryHistory = report.dietary_history as DietaryHistory | null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/patient/anamnesis">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            Anamnese
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Aprovado
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(report.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            {report.approved_at && (
              <> — Aprovada em {format(new Date(report.approved_at), "d 'de' MMMM", { locale: ptBR })}</>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Chief Complaint */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Queixa Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{report.chief_complaint || "Não informado"}</p>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Clínico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{report.history_present_illness || "Não informado"}</p>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objetivos</CardTitle>
            </CardHeader>
            <CardContent>
              <ListSection label="" items={report.goals as string[]} />
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Médico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ListSection label="Antecedentes Pessoais" items={report.past_medical_history as string[]} />
              <Separator />
              <ListSection label="Histórico Familiar" items={report.family_history as string[]} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Social History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Social</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "occupation", label: "Profissão" },
                { key: "lifestyle", label: "Estilo de Vida" },
                { key: "physical_activity", label: "Atividade Física" },
                { key: "sleep_pattern", label: "Padrão de Sono" },
                { key: "stress_level", label: "Nível de Estresse" },
                { key: "alcohol_consumption", label: "Consumo de Álcool" },
                { key: "smoking_status", label: "Tabagismo" },
              ].map(({ key, label }) => (
                <TextSection
                  key={key}
                  label={label}
                  value={socialHistory?.[key as keyof SocialHistory]}
                />
              ))}
            </CardContent>
          </Card>

          {/* Dietary History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Alimentar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TextSection label="Dia Típico" value={dietaryHistory?.typical_day} />
              <TextSection label="Frequência de Refeições" value={dietaryHistory?.meal_frequency} />
              <TextSection label="Refeições Fora de Casa" value={dietaryHistory?.eating_out_frequency} />
              <TextSection label="Consumo de Água" value={dietaryHistory?.water_intake} />
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <ListSection label="Alergias" items={dietaryHistory?.allergies} />
                <ListSection label="Intolerâncias" items={dietaryHistory?.intolerances} />
                <ListSection label="Restrições" items={dietaryHistory?.restrictions} />
                <ListSection label="Preferências" items={dietaryHistory?.preferences} />
              </div>
            </CardContent>
          </Card>

          {/* Medications & Supplements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medicamentos e Suplementos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ListSection label="Medicamentos em Uso" items={report.current_medications as string[]} />
              <Separator />
              <ListSection label="Suplementos" items={report.supplements as string[]} />
            </CardContent>
          </Card>

          {/* Observations */}
          {report.observations && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.observations}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
