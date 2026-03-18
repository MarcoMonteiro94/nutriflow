"use client";

import { Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWizard, WizardProvider } from "./wizard-context";
import { WizardStepper } from "./wizard-stepper";
import { WizardComplete } from "./wizard-complete";
import { PatientInfoStep } from "./steps/patient-info-step";
import { AnamnesisStep } from "./steps/anamnesis-step";
import { AnthropometryStep } from "./steps/anthropometry-step";
import { MeasurementsStep } from "./steps/measurements-step";
import { MealPlanStep } from "./steps/meal-plan-step";
import type { NutriOption } from "@/lib/queries/organization";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const slideTransition = {
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
} as const;

interface WizardContentProps {
  isReceptionist: boolean;
  nutris: NutriOption[];
}

function WizardContent({ isReceptionist, nutris }: WizardContentProps) {
  const { currentStep, totalSteps, direction } = useWizard();

  const isComplete = currentStep > totalSteps;

  if (isComplete) {
    return <WizardComplete />;
  }

  return (
    <div className="space-y-8">
      <WizardStepper />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
        >
          {currentStep === 1 && (
            <PatientInfoStep
              isReceptionist={isReceptionist}
              nutris={nutris}
            />
          )}
          {currentStep === 2 && <AnamnesisStep />}
          {currentStep === 3 && <AnthropometryStep />}
          {currentStep === 4 && <MeasurementsStep />}
          {currentStep === 5 && <MealPlanStep />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface OnboardingWizardProps {
  isReceptionist: boolean;
  nutris: NutriOption[];
}

export function OnboardingWizard({ isReceptionist, nutris }: OnboardingWizardProps) {
  return (
    <Suspense>
      <WizardProvider>
        <WizardContent isReceptionist={isReceptionist} nutris={nutris} />
      </WizardProvider>
    </Suspense>
  );
}
