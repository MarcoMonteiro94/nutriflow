"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";

const FORM_ID = "wizard-anamnesis";

export function AnamnesisStep() {
  const { patientId, markStepCompleted, nextStep, skipStep } = useWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patientId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const chiefComplaint = (formData.get("chief_complaint") as string) || null;
      const historyPresentIllness = (formData.get("history_present_illness") as string) || null;
      const currentMedications = (formData.get("current_medications") as string) || null;
      const allergies = (formData.get("allergies") as string) || null;
      const observations = (formData.get("observations") as string) || null;

      // Only save if at least one field is filled
      const hasContent = chiefComplaint || historyPresentIllness || currentMedications || allergies || observations;

      if (!hasContent) {
        skipStep();
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Você precisa estar logado.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("anamnesis_reports")
        .insert({
          patient_id: patientId,
          nutri_id: user.id,
          source_type: "text",
          status: "approved",
          chief_complaint: chiefComplaint,
          history_present_illness: historyPresentIllness,
          current_medications: currentMedications ? currentMedications.split(",").map((s) => s.trim()).filter(Boolean) : [],
          dietary_history: allergies
            ? { allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean) }
            : {},
          observations,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      markStepCompleted(2, data?.id);
      nextStep();
    } catch {
      setError("Erro ao salvar anamnese. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Anamnese Rápida</CardTitle>
          <CardDescription>
            Registre as informações clínicas iniciais. Você pode fazer uma anamnese completa
            (com áudio e IA) depois na ficha do paciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="chief_complaint">Queixa Principal</Label>
              <Input
                id="chief_complaint"
                name="chief_complaint"
                placeholder="Motivo da consulta, objetivo do paciente..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="history_present_illness">Histórico Clínico</Label>
              <Textarea
                id="history_present_illness"
                name="history_present_illness"
                rows={3}
                placeholder="Doenças prévias, cirurgias, condições atuais..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current_medications">Medicamentos em Uso</Label>
                <Input
                  id="current_medications"
                  name="current_medications"
                  placeholder="Separados por vírgula"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Metformina, Losartana
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias Alimentares</Label>
                <Input
                  id="allergies"
                  name="allergies"
                  placeholder="Separadas por vírgula"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Lactose, Glúten, Camarão
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                name="observations"
                rows={2}
                placeholder="Outras informações relevantes..."
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <WizardNavigation
        formId={FORM_ID}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
