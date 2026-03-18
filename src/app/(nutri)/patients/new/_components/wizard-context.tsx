"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface StepStatus {
  completed: boolean;
  skipped: boolean;
  recordId?: string;
}

export interface PatientData {
  full_name: string;
  gender?: string | null;
  birth_date?: string | null;
}

export interface WizardContextValue {
  currentStep: number;
  totalSteps: number;
  patientId: string | null;
  patientData: PatientData | null;
  stepStatuses: Record<number, StepStatus>;
  direction: number; // 1 = forward, -1 = backward
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  markStepCompleted: (step: number, recordId?: string) => void;
  setPatientId: (id: string) => void;
  setPatientData: (data: PatientData) => void;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

const TOTAL_STEPS = 4;

export const WIZARD_STEPS = [
  { number: 1, label: "Paciente", description: "Dados básicos", required: true },
  { number: 2, label: "Anamnese", description: "Histórico clínico", required: false },
  { number: 3, label: "Antropometria", description: "Composição corporal", required: false },
  { number: 4, label: "Plano Alimentar", description: "Dieta inicial", required: false },
] as const;

interface WizardProviderProps {
  children: ReactNode;
  initialStep?: number;
  initialPatientId?: string | null;
}

export function WizardProvider({
  children,
  initialStep = 1,
  initialPatientId = null,
}: WizardProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [patientId, setPatientIdState] = useState<string | null>(initialPatientId);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({});
  const [direction, setDirection] = useState(1);

  const updateUrl = useCallback(
    (step: number, pId?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step.toString());
      const id = pId !== undefined ? pId : patientId;
      if (id) {
        params.set("patientId", id);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, patientId]
  );

  const goToStep = useCallback(
    (step: number) => {
      if (step < 1 || step > TOTAL_STEPS + 1) return; // +1 for completion screen
      // Can only go forward past step 1 if patient was created
      if (step > 1 && !patientId) return;
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
      if (step <= TOTAL_STEPS) {
        updateUrl(step);
      }
    },
    [currentStep, patientId, updateUrl]
  );

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const skipStep = useCallback(() => {
    setStepStatuses((prev) => ({
      ...prev,
      [currentStep]: { completed: false, skipped: true },
    }));
    // If on last step, go to completion
    if (currentStep === TOTAL_STEPS) {
      setDirection(1);
      setCurrentStep(TOTAL_STEPS + 1);
    } else {
      nextStep();
    }
  }, [currentStep, nextStep]);

  const markStepCompleted = useCallback(
    (step: number, recordId?: string) => {
      setStepStatuses((prev) => ({
        ...prev,
        [step]: { completed: true, skipped: false, recordId },
      }));
    },
    []
  );

  const setPatientId = useCallback(
    (id: string) => {
      setPatientIdState(id);
      updateUrl(currentStep, id);
    },
    [currentStep, updateUrl]
  );

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        totalSteps: TOTAL_STEPS,
        patientId,
        patientData,
        stepStatuses,
        direction,
        goToStep,
        nextStep,
        prevStep,
        skipStep,
        markStepCompleted,
        setPatientId,
        setPatientData,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
