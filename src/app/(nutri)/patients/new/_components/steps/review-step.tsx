"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  SkipForward,
  Loader2,
  AlertCircle,
  ArrowRight,
  User,
  FileText,
  Ruler,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard, WIZARD_STEPS } from "../wizard-context";
import { FadeIn } from "@/components/motion";
import { motion } from "framer-motion";

const stepIcons = [User, FileText, Ruler, UtensilsCrossed];

export function ReviewStep() {
  const {
    wizardData,
    stepStatuses,
    isSaving,
    saveResult,
    saveAll,
    savedPatientId,
    goToStep,
  } = useWizard();

  // Success state
  if (saveResult?.success && savedPatientId) {
    const completedSteps = Object.values(stepStatuses).filter(
      (s) => s.completed
    ).length;
    const skippedSteps = Object.values(stepStatuses).filter(
      (s) => s.skipped
    ).length;

    return (
      <FadeIn
        direction="up"
        className="mx-auto max-w-lg space-y-8 py-8 text-center"
      >
        <div className="space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
          >
            <Check className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Paciente cadastrado!
          </h2>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {wizardData.patient?.full_name}
            </span>{" "}
            foi adicionado com sucesso.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              Resumo do cadastro
            </h3>
            <div className="space-y-3">
              {WIZARD_STEPS.slice(0, 4).map((step) => {
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
                        !isCompleted &&
                          !isSkipped &&
                          "bg-muted text-muted-foreground"
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
                        (isSkipped || (!isCompleted && !isSkipped)) &&
                          "text-muted-foreground"
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
                      {isCompleted
                        ? "Preenchido"
                        : isSkipped
                          ? "Pulado"
                          : "—"}
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
            <Link href={`/patients/${savedPatientId}`}>
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

  // Review state
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revisão do Cadastro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient summary */}
          {wizardData.patient && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Dados do Paciente</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(1)}
                >
                  Editar
                </Button>
              </div>
              <div className="rounded-xl border p-4 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Nome:</span>{" "}
                  {wizardData.patient.full_name}
                </p>
                {wizardData.patient.email && (
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {wizardData.patient.email}
                  </p>
                )}
                {wizardData.patient.phone && (
                  <p>
                    <span className="text-muted-foreground">Telefone:</span>{" "}
                    {wizardData.patient.phone}
                  </p>
                )}
                {wizardData.patient.gender && (
                  <p>
                    <span className="text-muted-foreground">Gênero:</span>{" "}
                    {wizardData.patient.gender}
                  </p>
                )}
                {wizardData.patient.goal && (
                  <p>
                    <span className="text-muted-foreground">Objetivo:</span>{" "}
                    {wizardData.patient.goal}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Anamnesis summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Anamnese</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToStep(2)}
              >
                {wizardData.anamnesis ? "Editar" : "Preencher"}
              </Button>
            </div>
            {wizardData.anamnesis ? (
              <div className="rounded-xl border p-4 text-sm space-y-1">
                {wizardData.anamnesis.chief_complaint && (
                  <p>
                    <span className="text-muted-foreground">Queixa:</span>{" "}
                    {wizardData.anamnesis.chief_complaint}
                  </p>
                )}
                {wizardData.anamnesis.current_medications.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">
                      Medicamentos:
                    </span>{" "}
                    {wizardData.anamnesis.current_medications.join(", ")}
                  </p>
                )}
                {wizardData.anamnesis.allergies.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Alergias:</span>{" "}
                    {wizardData.anamnesis.allergies.join(", ")}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pulado</p>
            )}
          </div>

          {/* Anthropometry summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Antropometria</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToStep(3)}
              >
                {wizardData.anthropometry ? "Editar" : "Preencher"}
              </Button>
            </div>
            {wizardData.anthropometry ? (
              <div className="rounded-xl border p-4 text-sm space-y-1">
                {wizardData.anthropometry.weight && (
                  <p>
                    <span className="text-muted-foreground">Peso:</span>{" "}
                    {wizardData.anthropometry.weight} kg
                  </p>
                )}
                {wizardData.anthropometry.height && (
                  <p>
                    <span className="text-muted-foreground">Altura:</span>{" "}
                    {wizardData.anthropometry.height} cm
                  </p>
                )}
                {wizardData.anthropometry.bmi && (
                  <p>
                    <span className="text-muted-foreground">IMC:</span>{" "}
                    {wizardData.anthropometry.bmi.toFixed(1)}
                  </p>
                )}
                {wizardData.anthropometry.body_fat_percentage && (
                  <p>
                    <span className="text-muted-foreground">
                      % Gordura:
                    </span>{" "}
                    {wizardData.anthropometry.body_fat_percentage.toFixed(1)}%
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pulado</p>
            )}
          </div>

          {/* Meal plan summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Plano Alimentar</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToStep(4)}
              >
                {wizardData.mealPlan ? "Editar" : "Preencher"}
              </Button>
            </div>
            {wizardData.mealPlan ? (
              <div className="rounded-xl border p-4 text-sm space-y-1">
                {wizardData.mealPlan.title && (
                  <p>
                    <span className="text-muted-foreground">Título:</span>{" "}
                    {wizardData.mealPlan.title}
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {wizardData.mealPlan.status === "active"
                    ? "Ativo"
                    : "Arquivado"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pulado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {saveResult?.error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">
              Erro ao salvar ({WIZARD_STEPS[saveResult.error.step - 1]?.label})
            </p>
            <p className="mt-1 text-destructive/80">
              {saveResult.error.message}
            </p>
            {savedPatientId && (
              <p className="mt-2 text-muted-foreground">
                O paciente foi criado parcialmente.{" "}
                <Link
                  href={`/patients/${savedPatientId}`}
                  className="text-primary hover:underline"
                >
                  Ir para o paciente
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => goToStep(4)}
          disabled={isSaving}
        >
          Voltar
        </Button>
        <Button onClick={saveAll} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? "Salvando..." : "Salvar tudo"}
        </Button>
      </div>
    </div>
  );
}
