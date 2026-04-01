"use client";

import { Check, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard, WIZARD_STEPS } from "./wizard-context";
import { motion } from "framer-motion";

export function WizardStepper() {
  const { currentStep, stepStatuses, goToStep, patientId } = useWizard();

  return (
    <nav aria-label="Progresso do cadastro" className="w-full">
      {/* Desktop stepper */}
      <ol className="hidden sm:flex items-center gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const status = stepStatuses[step.number];
          const isActive = currentStep === step.number;
          const isCompleted = status?.completed;
          const isSkipped = status?.skipped;
          const isAccessible =
            step.number === 1 ||
            (patientId && (step.number <= currentStep || status?.completed || status?.skipped));

          return (
            <li key={step.number} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => isAccessible && goToStep(step.number)}
                disabled={!isAccessible}
                className={cn(
                  "group flex items-center gap-3 w-full rounded-xl p-3 transition-colors",
                  isActive && "bg-primary/5",
                  isAccessible && !isActive && "hover:bg-muted/50 cursor-pointer",
                  !isAccessible && "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all",
                    isActive && "bg-primary text-primary-foreground shadow-sm",
                    isCompleted && !isActive && "bg-primary/10 text-primary",
                    isSkipped && !isActive && "bg-muted text-muted-foreground",
                    !isActive && !isCompleted && !isSkipped && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : isSkipped ? (
                    <SkipForward className="h-3.5 w-3.5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </button>
              {index < WIZARD_STEPS.length - 1 && (
                <div className="mx-1 h-px w-6 shrink-0 bg-border" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile stepper - compact */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">
            Passo {currentStep} de {WIZARD_STEPS.length}
          </p>
          <p className="text-sm text-muted-foreground">
            {WIZARD_STEPS[currentStep - 1].label}
          </p>
        </div>
        <div className="flex gap-1.5">
          {WIZARD_STEPS.map((step) => {
            const status = stepStatuses[step.number];
            const isActive = currentStep === step.number;
            const isCompleted = status?.completed;
            const isSkipped = status?.skipped;

            return (
              <motion.div
                key={step.number}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  isActive && "bg-primary",
                  isCompleted && !isActive && "bg-primary/40",
                  isSkipped && !isActive && "bg-muted-foreground/30",
                  !isActive && !isCompleted && !isSkipped && "bg-muted"
                )}
                layoutId={isActive ? "activeStep" : undefined}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}
