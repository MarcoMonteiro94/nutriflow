"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  SkipForward,
  User,
  FileText,
  Ruler,
  Weight,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard, WIZARD_STEPS } from "./wizard-context";
import { FadeIn } from "@/components/motion";
import { motion } from "framer-motion";

const stepIcons = [User, FileText, Ruler, Weight, UtensilsCrossed];

export function WizardComplete() {
  const { patientId, patientData, stepStatuses } = useWizard();

  const completedSteps = Object.values(stepStatuses).filter((s) => s.completed).length;
  const skippedSteps = Object.values(stepStatuses).filter((s) => s.skipped).length;

  return (
    <FadeIn direction="up" className="mx-auto max-w-lg space-y-8 py-8 text-center">
      <div className="space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
        >
          <Check className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Paciente cadastrado!
        </h2>
        <p className="text-muted-foreground">
          {patientData?.full_name ? (
            <>
              <span className="font-medium text-foreground">{patientData.full_name}</span>{" "}
              foi adicionado com sucesso.
            </>
          ) : (
            "O paciente foi adicionado com sucesso."
          )}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Resumo do cadastro
          </h3>
          <div className="space-y-3">
            {WIZARD_STEPS.map((step) => {
              const status = stepStatuses[step.number];
              const Icon = stepIcons[step.number - 1];
              const isCompleted = status?.completed;
              const isSkipped = status?.skipped;

              return (
                <div
                  key={step.number}
                  className="flex items-center gap-3 text-sm"
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      isCompleted && "bg-primary/10 text-primary",
                      isSkipped && "bg-muted text-muted-foreground",
                      !isCompleted && !isSkipped && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isSkipped ? (
                      <SkipForward className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "flex-1 text-left",
                      isCompleted && "text-foreground",
                      (isSkipped || (!isCompleted && !isSkipped)) && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      isCompleted && "text-primary",
                      isSkipped && "text-muted-foreground"
                    )}
                  >
                    {isCompleted ? "Preenchido" : isSkipped ? "Pulado" : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
            <span>{completedSteps} preenchidos</span>
            <span>{skippedSteps} pulados</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href={`/patients/${patientId}`}>
            Ver Paciente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/patients">Voltar para Lista</Link>
        </Button>
      </div>
    </FadeIn>
  );
}
