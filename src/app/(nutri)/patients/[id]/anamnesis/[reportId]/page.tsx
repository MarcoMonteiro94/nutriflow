"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AudioPlayer } from "@/components/anamnesis/audio-player";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  FileText,
  AlertCircle,
  Pencil,
  Eye,
  Brain,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/use-auto-save";
import type {
  AnamnesisReport,
  SocialHistory,
  DietaryHistory,
} from "@/types/anamnesis";

interface PageProps {
  params: Promise<{ id: string; reportId: string }>;
}

export default function AnamnesisReviewPage({ params }: PageProps) {
  const { id: patientId, reportId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [report, setReport] = useState<AnamnesisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState<Partial<AnamnesisReport>>({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save hook
  const { status: autoSaveStatus } = useAutoSave({
    data: editedReport,
    onSave: async (data) => {
      if (!report) return;
      await saveChanges(data);
    },
    debounceMs: 2000,
    enabled: isEditing && Object.keys(editedReport).length > 0,
  });

  // Load report data
  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("anamnesis_reports")
        .select("*")
        .eq("id", reportId)
        .eq("nutri_id", user.id)
        .single();

      if (error || !data) {
        toast.error("Relatório não encontrado");
        router.push(`/patients/${patientId}/anamnesis`);
        return;
      }

      const reportData = data as AnamnesisReport;
      setReport(reportData);

      // Get signed URL for audio if available
      if (reportData.audio_file_path) {
        const { data: signedUrl } = await supabase.storage
          .from("anamnesis-audio")
          .createSignedUrl(reportData.audio_file_path, 3600);

        if (signedUrl) {
          setAudioUrl(signedUrl.signedUrl);
        }
      }

      setIsLoading(false);
    }

    loadReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, patientId, router]);

  const saveChanges = useCallback(async (changes: Partial<AnamnesisReport>) => {
    if (!report) return;

    // Convert to database-compatible format
    const dbChanges = {
      ...changes,
      social_history: changes.social_history as any,
      dietary_history: changes.dietary_history as any,
    };

    const { error } = await supabase
      .from("anamnesis_reports")
      .update(dbChanges)
      .eq("id", reportId);

    if (error) {
      throw error;
    }

    setReport((prev) => (prev ? { ...prev, ...changes } : null));
  }, [report, reportId, supabase]);

  const handleFieldChange = (
    field: keyof AnamnesisReport,
    value: string | string[]
  ) => {
    setEditedReport((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialHistoryChange = (
    field: keyof SocialHistory,
    value: string
  ) => {
    setEditedReport((prev) => ({
      ...prev,
      social_history: {
        ...(report?.social_history || {}),
        ...(prev.social_history || {}),
        [field]: value,
      },
    }));
  };

  const handleDietaryHistoryChange = (
    field: keyof DietaryHistory,
    value: string | string[]
  ) => {
    setEditedReport((prev) => ({
      ...prev,
      dietary_history: {
        ...(report?.dietary_history || {}),
        ...(prev.dietary_history || {}),
        [field]: value,
      },
    }));
  };

  const handleArrayFieldChange = (
    field: keyof AnamnesisReport,
    value: string
  ) => {
    const array = value
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    handleFieldChange(field, array);
  };

  const handleSaveManual = async () => {
    if (!report || Object.keys(editedReport).length === 0) return;

    setIsSaving(true);
    try {
      await saveChanges(editedReport);
      setEditedReport({});
      toast.success("Alterações salvas");
    } catch {
      toast.error("Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!report) return;

    setIsSaving(true);
    try {
      // Save any pending changes first
      if (Object.keys(editedReport).length > 0) {
        await saveChanges(editedReport);
        setEditedReport({});
      }

      // Approve the report
      await saveChanges({
        status: "approved",
        approved_at: new Date().toISOString(),
      } as Partial<AnamnesisReport>);

      toast.success("Anamnese aprovada!");
      router.push(`/patients/${patientId}/anamnesis`);
    } catch {
      toast.error("Erro ao aprovar anamnese");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const mergedReport = { ...report, ...editedReport };
  const socialHistory = mergedReport.social_history as SocialHistory;
  const dietaryHistory = mergedReport.dietary_history as DietaryHistory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/patients/${patientId}/anamnesis`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              Revisar Anamnese
              <Badge
                variant={report.status === "approved" ? "default" : "secondary"}
                className={
                  report.status === "approved"
                    ? "bg-green-500 hover:bg-green-600"
                    : ""
                }
              >
                {report.status === "approved" ? "Aprovado" : "Em Revisão"}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {report.confidence_score && (
                <span className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Confiança da IA: {Math.round(report.confidence_score * 100)}%
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4" />
                Visualizar
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Editar
              </>
            )}
          </Button>
          {isEditing && (
            <Button
              variant="outline"
              onClick={handleSaveManual}
              disabled={isSaving || Object.keys(editedReport).length === 0}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          )}
          {report.status !== "approved" && (
            <Button
              onClick={handleApprove}
              disabled={isSaving}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Aprovar
            </Button>
          )}
        </div>
      </div>

      {/* Auto-save indicator */}
      {isEditing && autoSaveStatus !== "idle" && (
        <div className="text-sm text-muted-foreground">
          {autoSaveStatus === "saving" && "Salvando..."}
          {autoSaveStatus === "saved" && "Salvo automaticamente"}
          {autoSaveStatus === "error" && "Erro ao salvar"}
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <AudioPlayer
          audioUrl={audioUrl}
          durationSeconds={report.audio_duration_seconds ?? undefined}
        />
      )}

      {/* Transcript Toggle */}
      {report.original_transcript && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Transcrição Original
              <Badge variant="outline" className="ml-auto">
                {showTranscript ? "Ocultar" : "Mostrar"}
              </Badge>
            </CardTitle>
          </CardHeader>
          {showTranscript && (
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {report.original_transcript}
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Chief Complaint */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Queixa Principal</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={mergedReport.chief_complaint ?? ""}
                  onChange={(e) =>
                    handleFieldChange("chief_complaint", e.target.value)
                  }
                  placeholder="Queixa principal do paciente"
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-sm">
                  {mergedReport.chief_complaint || "Não informado"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* History of Present Illness */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                História da Doença Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={mergedReport.history_present_illness ?? ""}
                  onChange={(e) =>
                    handleFieldChange("history_present_illness", e.target.value)
                  }
                  placeholder="Descrição da história atual"
                  className="min-h-[150px]"
                />
              ) : (
                <p className="text-sm">
                  {mergedReport.history_present_illness || "Não informado"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objetivos</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={(mergedReport.goals as string[])?.join("\n") ?? ""}
                  onChange={(e) =>
                    handleArrayFieldChange("goals", e.target.value)
                  }
                  placeholder="Um objetivo por linha"
                  className="min-h-[100px]"
                />
              ) : (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {(mergedReport.goals as string[])?.length > 0 ? (
                    (mergedReport.goals as string[]).map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">Não informado</li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Médico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Antecedentes Pessoais
                </Label>
                {isEditing ? (
                  <Textarea
                    value={
                      (mergedReport.past_medical_history as string[])?.join(
                        "\n"
                      ) ?? ""
                    }
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "past_medical_history",
                        e.target.value
                      )
                    }
                    placeholder="Um item por linha"
                    className="min-h-[80px] mt-1"
                  />
                ) : (
                  <ul className="list-disc list-inside text-sm mt-1">
                    {(mergedReport.past_medical_history as string[])?.length >
                    0 ? (
                      (mergedReport.past_medical_history as string[]).map(
                        (item, i) => <li key={i}>{item}</li>
                      )
                    ) : (
                      <li className="text-muted-foreground">Não informado</li>
                    )}
                  </ul>
                )}
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">
                  Histórico Familiar
                </Label>
                {isEditing ? (
                  <Textarea
                    value={
                      (mergedReport.family_history as string[])?.join("\n") ??
                      ""
                    }
                    onChange={(e) =>
                      handleArrayFieldChange("family_history", e.target.value)
                    }
                    placeholder="Um item por linha"
                    className="min-h-[80px] mt-1"
                  />
                ) : (
                  <ul className="list-disc list-inside text-sm mt-1">
                    {(mergedReport.family_history as string[])?.length > 0 ? (
                      (mergedReport.family_history as string[]).map(
                        (item, i) => <li key={i}>{item}</li>
                      )
                    ) : (
                      <li className="text-muted-foreground">Não informado</li>
                    )}
                  </ul>
                )}
              </div>
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
                <div key={key}>
                  <Label className="text-xs text-muted-foreground">
                    {label}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={socialHistory?.[key as keyof SocialHistory] ?? ""}
                      onChange={(e) =>
                        handleSocialHistoryChange(
                          key as keyof SocialHistory,
                          e.target.value
                        )
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {socialHistory?.[key as keyof SocialHistory] ||
                        "Não informado"}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Dietary History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Alimentar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Dia Típico
                </Label>
                {isEditing ? (
                  <Textarea
                    value={dietaryHistory?.typical_day ?? ""}
                    onChange={(e) =>
                      handleDietaryHistoryChange("typical_day", e.target.value)
                    }
                    className="min-h-[100px] mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1">
                    {dietaryHistory?.typical_day || "Não informado"}
                  </p>
                )}
              </div>

              {[
                { key: "meal_frequency", label: "Frequência de Refeições" },
                {
                  key: "eating_out_frequency",
                  label: "Refeições Fora de Casa",
                },
                { key: "water_intake", label: "Consumo de Água" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground">
                    {label}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={
                        dietaryHistory?.[key as keyof DietaryHistory] as string ?? ""
                      }
                      onChange={(e) =>
                        handleDietaryHistoryChange(
                          key as keyof DietaryHistory,
                          e.target.value
                        )
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {(dietaryHistory?.[key as keyof DietaryHistory] as string) ||
                        "Não informado"}
                    </p>
                  )}
                </div>
              ))}

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "allergies", label: "Alergias" },
                  { key: "intolerances", label: "Intolerâncias" },
                  { key: "restrictions", label: "Restrições" },
                  { key: "preferences", label: "Preferências" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={
                          (
                            dietaryHistory?.[
                              key as keyof DietaryHistory
                            ] as string[]
                          )?.join("\n") ?? ""
                        }
                        onChange={(e) => {
                          const array = e.target.value
                            .split("\n")
                            .filter((item) => item.trim());
                          handleDietaryHistoryChange(
                            key as keyof DietaryHistory,
                            array
                          );
                        }}
                        className="min-h-[60px] mt-1 text-sm"
                        placeholder="Um por linha"
                      />
                    ) : (
                      <ul className="list-disc list-inside text-sm mt-1">
                        {(
                          dietaryHistory?.[
                            key as keyof DietaryHistory
                          ] as string[]
                        )?.length > 0 ? (
                          (
                            dietaryHistory?.[
                              key as keyof DietaryHistory
                            ] as string[]
                          ).map((item, i) => <li key={i}>{item}</li>)
                        ) : (
                          <li className="text-muted-foreground">Nenhum</li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Medications & Supplements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Medicamentos e Suplementos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Medicamentos em Uso
                </Label>
                {isEditing ? (
                  <Textarea
                    value={
                      (mergedReport.current_medications as string[])?.join(
                        "\n"
                      ) ?? ""
                    }
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "current_medications",
                        e.target.value
                      )
                    }
                    placeholder="Um medicamento por linha"
                    className="min-h-[80px] mt-1"
                  />
                ) : (
                  <ul className="list-disc list-inside text-sm mt-1">
                    {(mergedReport.current_medications as string[])?.length >
                    0 ? (
                      (mergedReport.current_medications as string[]).map(
                        (item, i) => <li key={i}>{item}</li>
                      )
                    ) : (
                      <li className="text-muted-foreground">Nenhum</li>
                    )}
                  </ul>
                )}
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">
                  Suplementos
                </Label>
                {isEditing ? (
                  <Textarea
                    value={
                      (mergedReport.supplements as string[])?.join("\n") ?? ""
                    }
                    onChange={(e) =>
                      handleArrayFieldChange("supplements", e.target.value)
                    }
                    placeholder="Um suplemento por linha"
                    className="min-h-[80px] mt-1"
                  />
                ) : (
                  <ul className="list-disc list-inside text-sm mt-1">
                    {(mergedReport.supplements as string[])?.length > 0 ? (
                      (mergedReport.supplements as string[]).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">Nenhum</li>
                    )}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={mergedReport.observations ?? ""}
                  onChange={(e) =>
                    handleFieldChange("observations", e.target.value)
                  }
                  placeholder="Observações adicionais"
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-sm">
                  {mergedReport.observations || "Nenhuma observação"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confidence Warning */}
      {report.confidence_score && report.confidence_score < 0.7 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Confiança baixa na extração
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                A IA teve dificuldade em extrair algumas informações. Revise
                cuidadosamente os campos e compare com a transcrição original.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
