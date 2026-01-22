"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, AudioLines, Brain, CheckCircle2, XCircle } from "lucide-react";
import type { ProcessingStep } from "@/types/anamnesis";
import { cn } from "@/lib/utils";

interface ProcessingIndicatorProps {
  step: ProcessingStep;
  progress?: number;
  message?: string;
  error?: string;
}

const steps: { key: ProcessingStep; label: string; icon: React.ElementType }[] = [
  { key: "uploading", label: "Enviando áudio", icon: Upload },
  { key: "transcribing", label: "Transcrevendo", icon: AudioLines },
  { key: "processing", label: "Processando com IA", icon: Brain },
  { key: "complete", label: "Concluído", icon: CheckCircle2 },
];

export function ProcessingIndicator({
  step,
  progress = 0,
  message,
  error,
}: ProcessingIndicatorProps) {
  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const isError = step === "error";

  if (step === "idle") {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  isError ? "bg-destructive" : "bg-primary"
                )}
                style={{
                  width: isError
                    ? "100%"
                    : step === "complete"
                      ? "100%"
                      : `${Math.max((currentStepIndex / (steps.length - 1)) * 100, progress)}%`,
                }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="flex justify-between">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = s.key === step;
              const isComplete = currentStepIndex > index || step === "complete";
              const isPending = currentStepIndex < index && step !== "error";

              return (
                <div
                  key={s.key}
                  className={cn(
                    "flex flex-col items-center gap-2",
                    isActive && "text-primary",
                    isComplete && "text-primary",
                    isPending && "text-muted-foreground",
                    isError && "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isActive && "border-primary bg-primary/10",
                      isComplete && "border-primary bg-primary text-primary-foreground",
                      isPending && "border-muted bg-muted",
                      isError && "border-muted bg-muted"
                    )}
                  >
                    {isActive && !isError ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center hidden sm:block">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="text-center">
            {isError ? (
              <div className="flex items-center justify-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  {error || "Ocorreu um erro durante o processamento"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {message || getDefaultMessage(step)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getDefaultMessage(step: ProcessingStep): string {
  switch (step) {
    case "uploading":
      return "Enviando arquivo de áudio...";
    case "transcribing":
      return "Convertendo áudio em texto com Whisper...";
    case "processing":
      return "Analisando e estruturando informações com IA...";
    case "complete":
      return "Processamento concluído! Revisando relatório...";
    default:
      return "";
  }
}
