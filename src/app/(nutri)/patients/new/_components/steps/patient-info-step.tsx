"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ACTIVITY_LEVELS } from "@/lib/nutrition-calculations";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";
import type { NutriOption } from "@/lib/queries/organization";

const FORM_ID = "wizard-patient-info";

interface PatientInfoStepProps {
  isReceptionist: boolean;
  nutris: NutriOption[];
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function PatientInfoStep({
  isReceptionist,
  nutris,
}: PatientInfoStepProps) {
  const { setStepData, markStepCompleted, nextStep, wizardData } = useWizard();

  const existing = wizardData.patient;
  const [selectedNutriId, setSelectedNutriId] = useState<string>(
    existing?.nutri_id_override || (nutris.length === 1 ? nutris[0].id : "")
  );
  const [phone, setPhone] = useState(() =>
    formatPhone(existing?.phone ?? "")
  );
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPhone(formatPhone(e.target.value));
    },
    []
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const fullName = (formData.get("full_name") as string)?.trim();

    if (!fullName) {
      setError("Nome completo é obrigatório.");
      return;
    }

    if (isReceptionist && !selectedNutriId) {
      setError("Selecione um nutricionista para o paciente.");
      return;
    }

    setStepData(1, {
      full_name: fullName,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      birth_date: (formData.get("birth_date") as string) || null,
      gender: (formData.get("gender") as string) || null,
      activity_level: (formData.get("activity_level") as string) || null,
      goal: (formData.get("goal") as string) || null,
      notes: (formData.get("notes") as string) || null,
      nutri_id_override: isReceptionist ? selectedNutriId : undefined,
    });
    markStepCompleted(1);
    nextStep();
  }

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
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {isReceptionist && nutris.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="nutri">Nutricionista Responsável *</Label>
                <Select
                  value={selectedNutriId}
                  onValueChange={setSelectedNutriId}
                >
                  <SelectTrigger id="nutri">
                    <SelectValue placeholder="Selecione o nutricionista" />
                  </SelectTrigger>
                  <SelectContent>
                    {nutris.map((nutri) => (
                      <SelectItem key={nutri.id} value={nutri.id}>
                        {nutri.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione o nutricionista que será responsável por este
                  paciente.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  required
                  defaultValue={existing?.full_name}
                  placeholder="Digite o nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={existing?.email ?? ""}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={existing?.birth_date ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <select
                  id="gender"
                  name="gender"
                  defaultValue={existing?.gender ?? ""}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity_level">Nível de Atividade</Label>
                <select
                  id="activity_level"
                  name="activity_level"
                  defaultValue={existing?.activity_level ?? ""}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  {ACTIVITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} — {level.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="goal">Objetivo</Label>
                <Input
                  id="goal"
                  name="goal"
                  defaultValue={existing?.goal ?? ""}
                  placeholder="Ex: Emagrecimento, Ganho de massa muscular..."
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={existing?.notes ?? ""}
                  placeholder="Anotações sobre o paciente, restrições alimentares, etc."
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <WizardNavigation
        formId={FORM_ID}
        canSkip={false}
        submitLabel="Cadastrar e Continuar"
      />
    </div>
  );
}
