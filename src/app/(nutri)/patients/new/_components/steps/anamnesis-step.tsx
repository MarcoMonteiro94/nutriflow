"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";

const FORM_ID = "wizard-anamnesis";

export function AnamnesisStep() {
  const { markStepCompleted, nextStep, skipStep, setStepData, wizardData } =
    useWizard();

  const existing = wizardData.anamnesis;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const chiefComplaint =
      (formData.get("chief_complaint") as string) || null;
    const historyPresentIllness =
      (formData.get("history_present_illness") as string) || null;
    const currentMedications =
      (formData.get("current_medications") as string) || null;
    const allergies = (formData.get("allergies") as string) || null;
    const observations = (formData.get("observations") as string) || null;

    // Skip if no content
    const hasContent =
      chiefComplaint ||
      historyPresentIllness ||
      currentMedications ||
      allergies ||
      observations;

    if (!hasContent) {
      skipStep();
      return;
    }

    setStepData(2, {
      chief_complaint: chiefComplaint,
      history_present_illness: historyPresentIllness,
      current_medications: currentMedications
        ? currentMedications
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      allergies: allergies
        ? allergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      observations,
    });
    markStepCompleted(2);
    nextStep();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Anamnese Rápida</CardTitle>
          <CardDescription>
            Registre as informações clínicas iniciais. Você pode fazer uma
            anamnese completa (com áudio e IA) depois na ficha do paciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="chief_complaint">Queixa Principal</Label>
              <Input
                id="chief_complaint"
                name="chief_complaint"
                defaultValue={existing?.chief_complaint ?? ""}
                placeholder="Motivo da consulta, objetivo do paciente..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="history_present_illness">Histórico Clínico</Label>
              <Textarea
                id="history_present_illness"
                name="history_present_illness"
                rows={3}
                defaultValue={existing?.history_present_illness ?? ""}
                placeholder="Doenças prévias, cirurgias, condições atuais..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current_medications">Medicamentos em Uso</Label>
                <Input
                  id="current_medications"
                  name="current_medications"
                  defaultValue={existing?.current_medications?.join(", ") ?? ""}
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
                  defaultValue={existing?.allergies?.join(", ") ?? ""}
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
                defaultValue={existing?.observations ?? ""}
                placeholder="Outras informações relevantes..."
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <WizardNavigation formId={FORM_ID} />
    </div>
  );
}
