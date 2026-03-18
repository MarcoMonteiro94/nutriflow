"use client";

import { useCallback, useState } from "react";
import { MeasurementForm } from "@/app/(nutri)/patients/[id]/measurements/_components/measurement-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";

const FORM_ID = "wizard-measurements";

export function MeasurementsStep() {
  const { patientId, markStepCompleted, nextStep } = useWizard();
  const [isSubmitting] = useState(false);

  const handleSuccess = useCallback(
    (measurementId?: string) => {
      markStepCompleted(4, measurementId);
      nextStep();
    },
    [markStepCompleted, nextStep]
  );

  if (!patientId) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Medidas de Acompanhamento</CardTitle>
          <CardDescription>
            Registre peso, altura e outras medidas para acompanhamento. Diferente da
            antropometria, estas medidas são para evolução simplificada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementForm
            patientId={patientId}
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
