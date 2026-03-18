"use client";

import { useCallback } from "react";
import { PatientForm } from "@/app/(nutri)/patients/_components/patient-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";
import type { NutriOption } from "@/lib/queries/organization";

const FORM_ID = "wizard-patient-info";

interface PatientInfoStepProps {
  isReceptionist: boolean;
  nutris: NutriOption[];
}

export function PatientInfoStep({ isReceptionist, nutris }: PatientInfoStepProps) {
  const { setPatientId, setPatientData, markStepCompleted, nextStep, patientId } = useWizard();
  const handleSuccess = useCallback(
    (id: string, data: { full_name: string; gender?: string | null; birth_date?: string | null }) => {
      setPatientId(id);
      setPatientData({
        full_name: data.full_name,
        gender: data.gender,
        birth_date: data.birth_date,
      });
      markStepCompleted(1, id);
      nextStep();
    },
    [setPatientId, setPatientData, markStepCompleted, nextStep]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
          <CardDescription>
            Preencha os dados básicos do paciente. Campos com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm
            isReceptionist={isReceptionist}
            nutris={nutris}
            onSuccess={handleSuccess}
            hideNavigation
            formId={FORM_ID}
          />
        </CardContent>
      </Card>

      <WizardNavigation
        formId={FORM_ID}
        canSkip={false}
        submitLabel={patientId ? "Atualizar e Continuar" : "Cadastrar e Continuar"}
      />
    </div>
  );
}
