"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, SkipForward, Loader2 } from "lucide-react";
import { useWizard, WIZARD_STEPS } from "./wizard-context";

interface WizardNavigationProps {
  formId?: string;
  isSubmitting?: boolean;
  onSkip?: () => void;
  canSkip?: boolean;
  submitLabel?: string;
}

export function WizardNavigation({
  formId,
  isSubmitting = false,
  onSkip,
  canSkip = true,
  submitLabel,
}: WizardNavigationProps) {
  const { currentStep, totalSteps, prevStep, skipStep } = useWizard();

  const stepConfig = WIZARD_STEPS[currentStep - 1];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const showSkip = canSkip && !stepConfig.required;

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      skipStep();
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 border-t pt-6">
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSkip && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            <SkipForward className="mr-2 h-4 w-4" />
            Pular
          </Button>
        )}

        <Button
          type="submit"
          form={formId}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel
            ? submitLabel
            : isLastStep
              ? "Concluir"
              : (
                <>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
        </Button>
      </div>
    </div>
  );
}
