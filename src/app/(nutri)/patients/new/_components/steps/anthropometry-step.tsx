"use client";

import { useCallback, useState } from "react";
import { AnthropometryForm } from "@/app/(nutri)/patients/[id]/anthropometry/_components/anthropometry-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";

const FORM_ID = "wizard-anthropometry";

export function AnthropometryStep() {
  const { patientId, patientData, markStepCompleted, nextStep } = useWizard();
  const [isSubmitting] = useState(false);

  const handleSuccess = useCallback(
    (assessmentId?: string) => {
      markStepCompleted(3, assessmentId);
      nextStep();
    },
    [markStepCompleted, nextStep]
  );

  if (!patientId) return null;

  const hasGenderAndBirthDate = patientData?.gender && patientData?.birth_date;

  return (
    <div className="space-y-6">
      {!hasGenderAndBirthDate && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Dados incompletos do paciente</p>
            <p className="mt-1 text-amber-700 dark:text-amber-300">
              Para cálculos automáticos (% gordura corporal), defina o gênero e a data de
              nascimento na ficha do paciente.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Avaliação Antropométrica</CardTitle>
          <CardDescription>
            Registre as medidas de composição corporal. Dobras cutâneas e circunferências
            são opcionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnthropometryForm
            patientId={patientId}
            patient={{
              gender: patientData?.gender ?? null,
              birth_date: patientData?.birth_date ?? null,
            }}
            onSuccess={handleSuccess}
            hideNavigation
            formId={FORM_ID}
          />
        </CardContent>
      </Card>

      <WizardNavigation
        formId={FORM_ID}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
