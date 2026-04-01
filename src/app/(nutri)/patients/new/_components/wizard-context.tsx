"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { saveOnboardingWizard } from "../_lib/actions";
import type {
  WizardAccumulatedData,
  WizardPatientData,
  WizardAnamnesisData,
  WizardAnthropometryData,
  WizardMealPlanData,
  SaveWizardResult,
} from "../_lib/types";

export interface StepStatus {
  completed: boolean;
  skipped: boolean;
}

export interface PatientData {
  full_name: string;
  gender?: string | null;
  birth_date?: string | null;
}

export interface WizardContextValue {
  currentStep: number;
  totalSteps: number;
  wizardData: WizardAccumulatedData;
  patientData: PatientData | null;
  stepStatuses: Record<number, StepStatus>;
  direction: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  markStepCompleted: (step: number) => void;
  setStepData: (
    step: number,
    data:
      | WizardPatientData
      | WizardAnamnesisData
      | WizardAnthropometryData
      | WizardMealPlanData
  ) => void;
  // Save
  isSaving: boolean;
  saveResult: SaveWizardResult | null;
  saveAll: () => Promise<void>;
  savedPatientId: string | null;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

const TOTAL_STEPS = 5;

export const WIZARD_STEPS = [
  { number: 1, label: "Paciente", description: "Dados básicos", required: true },
  { number: 2, label: "Anamnese", description: "Histórico clínico", required: false },
  { number: 3, label: "Antropometria", description: "Composição corporal", required: false },
  { number: 4, label: "Plano Alimentar", description: "Dieta inicial", required: false },
  { number: 5, label: "Revisão", description: "Salvar cadastro", required: true },
] as const;

interface WizardProviderProps {
  children: ReactNode;
}

export function WizardProvider({ children }: WizardProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardAccumulatedData>({});
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>(
    {}
  );
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveWizardResult | null>(null);
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);

  // Use ref to avoid stale closure in goToStep
  const wizardDataRef = useRef(wizardData);
  wizardDataRef.current = wizardData;

  const updateUrl = useCallback(
    (step: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const goToStep = useCallback(
    (step: number) => {
      if (step < 1 || step > TOTAL_STEPS + 1) return;
      // Can only go forward past step 1 if patient data was collected
      if (step > 1 && !wizardDataRef.current.patient) return;
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
      if (step <= TOTAL_STEPS) {
        updateUrl(step);
      }
    },
    [currentStep, updateUrl]
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
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const markStepCompleted = useCallback((step: number) => {
    setStepStatuses((prev) => ({
      ...prev,
      [step]: { completed: true, skipped: false },
    }));
  }, []);

  const setStepData = useCallback(
    (
      step: number,
      data:
        | WizardPatientData
        | WizardAnamnesisData
        | WizardAnthropometryData
        | WizardMealPlanData
    ) => {
      // Eagerly update the ref so goToStep sees the new data immediately
      const eager = { ...wizardDataRef.current };
      switch (step) {
        case 1:
          eager.patient = data as WizardPatientData;
          break;
        case 2:
          eager.anamnesis = data as WizardAnamnesisData;
          break;
        case 3:
          eager.anthropometry = data as WizardAnthropometryData;
          break;
        case 4:
          eager.mealPlan = data as WizardMealPlanData;
          break;
      }
      wizardDataRef.current = eager;
      setWizardData(eager);
    },
    []
  );

  // Derived patientData for compatibility
  const patientData: PatientData | null = wizardData.patient
    ? {
        full_name: wizardData.patient.full_name,
        gender: wizardData.patient.gender,
        birth_date: wizardData.patient.birth_date,
      }
    : null;

  const saveAll = useCallback(async () => {
    setIsSaving(true);
    setSaveResult(null);

    try {
      const result = await saveOnboardingWizard(
        wizardDataRef.current,
        savedPatientId ?? undefined
      );
      setSaveResult(result);
      if (result.success && result.patientId) {
        setSavedPatientId(result.patientId);
      } else if (result.patientId) {
        // Partial failure — patient was created
        setSavedPatientId(result.patientId);
      }
    } catch {
      setSaveResult({
        success: false,
        error: { step: 1, message: "Erro inesperado ao salvar." },
      });
    } finally {
      setIsSaving(false);
    }
  }, [savedPatientId]);

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        totalSteps: TOTAL_STEPS,
        wizardData,
        patientData,
        stepStatuses,
        direction,
        goToStep,
        nextStep,
        prevStep,
        skipStep,
        markStepCompleted,
        setStepData,
        isSaving,
        saveResult,
        saveAll,
        savedPatientId,
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
