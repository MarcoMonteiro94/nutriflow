"use client";

import { useCallback, useState } from "react";
import { MealPlanForm } from "@/app/(nutri)/plans/_components/meal-plan-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";

const FORM_ID = "wizard-meal-plan";

export function MealPlanStep() {
  const { patientId, patientData, markStepCompleted, goToStep, totalSteps } = useWizard();
  const [isSubmitting] = useState(false);

  const handleSuccess = useCallback(
    (planId: string) => {
      markStepCompleted(5, planId);
      // Go to completion (step beyond last)
      goToStep(totalSteps + 1);
    },
    [markStepCompleted, goToStep, totalSteps]
  );

  const handleSkip = useCallback(() => {
    goToStep(totalSteps + 1);
  }, [goToStep, totalSteps]);

  if (!patientId) return null;

  // Create a minimal patient object for the select
  const patientForForm = {
    id: patientId,
    full_name: patientData?.full_name || "Paciente",
    email: null,
    phone: null,
    birth_date: patientData?.birth_date || null,
    gender: patientData?.gender || null,
    goal: null,
    notes: null,
    nutri_id: "",
    created_at: "",
    updated_at: "",
    profile_id: null,
    user_id: null,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plano Alimentar</CardTitle>
          <CardDescription>
            Crie o plano alimentar inicial. Após o cadastro, você poderá editar
            as refeições e alimentos no editor completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealPlanForm
            patients={[patientForForm]}
            defaultPatientId={patientId}
            onSuccess={handleSuccess}
            hideNavigation
            formId={FORM_ID}
            preselectedPatient
          />
        </CardContent>
      </Card>

      <WizardNavigation
        formId={FORM_ID}
        isSubmitting={isSubmitting}
        onSkip={handleSkip}
      />
    </div>
  );
}
