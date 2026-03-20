"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/types/database";
import type { NutriOption } from "@/lib/queries/organization";
import { ACTIVITY_LEVELS } from "@/lib/nutrition-calculations";

interface PatientFormProps {
  patient?: Patient;
  isReceptionist?: boolean;
  nutris?: NutriOption[];
  onSuccess?: (patientId: string, patientData: { full_name: string; gender?: string | null; birth_date?: string | null }) => void;
  hideNavigation?: boolean;
  formId?: string;
}

export function PatientForm({ patient, isReceptionist = false, nutris = [], onSuccess, hideNavigation = false, formId }: PatientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNutriId, setSelectedNutriId] = useState<string>(
    patient?.nutri_id || (nutris.length === 1 ? nutris[0].id : "")
  );

  const isEditing = !!patient;
  const isSubmittingRef = useRef(false);

  // Phone mask: (00) 00000-0000 or (00) 0000-0000
  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  const [phone, setPhone] = useState(() => formatPhone(patient?.phone ?? ""));
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Synchronous guard against double-submit (covers rapid double-clicks
    // before the async setState disables the button)
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Você precisa estar logado para cadastrar pacientes.");
        return;
      }

      const patientData = {
        full_name: formData.get("full_name") as string,
        email: (formData.get("email") as string) || null,
        phone: (formData.get("phone") as string) || null,
        birth_date: (formData.get("birth_date") as string) || null,
        gender: (formData.get("gender") as string) || null,
        activity_level: (formData.get("activity_level") as string) || null,
        goal: (formData.get("goal") as string) || null,
        notes: (formData.get("notes") as string) || null,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("patients")
          .update(patientData)
          .eq("id", patient.id);

        if (updateError) {
          if (updateError.code === "23505") {
            setError("Já existe um paciente com este email.");
          } else {
            setError(updateError.message);
          }
          return;
        }

        router.push(`/patients/${patient.id}`);
      } else {
        // For receptionists, use the selected nutri_id
        // For nutris/admins, use their own user.id
        const nutriIdToUse = isReceptionist && selectedNutriId ? selectedNutriId : user.id;

        if (isReceptionist && !selectedNutriId) {
          setError("Selecione um nutricionista para o paciente.");
          return;
        }

        const { data, error: insertError } = await supabase
          .from("patients")
          .insert({
            ...patientData,
            nutri_id: nutriIdToUse,
          })
          .select("id")
          .single();

        if (insertError || !data) {
          if (insertError?.code === "23505") {
            setError("Já existe um paciente com este email.");
          } else {
            setError(insertError?.message ?? "Erro ao criar paciente");
          }
          return;
        }

        if (onSuccess) {
          onSuccess(data.id, {
            full_name: patientData.full_name,
            gender: patientData.gender,
            birth_date: patientData.birth_date,
          });
          return;
        }

        router.push(`/patients/${data.id}`);
      }

      router.refresh();
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} id={formId} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {isReceptionist && nutris.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="nutri">Nutricionista Responsável *</Label>
          <Select value={selectedNutriId} onValueChange={setSelectedNutriId}>
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
            Selecione o nutricionista que será responsável por este paciente.
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
            defaultValue={patient?.full_name}
            placeholder="Digite o nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={patient?.email ?? ""}
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
            defaultValue={patient?.birth_date ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gênero</Label>
          <select
            id="gender"
            name="gender"
            defaultValue={patient?.gender ?? ""}
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
            defaultValue={patient?.activity_level ?? ""}
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
            defaultValue={patient?.goal ?? ""}
            placeholder="Ex: Emagrecimento, Ganho de massa muscular..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={patient?.notes ?? ""}
            placeholder="Anotações sobre o paciente, restrições alimentares, etc."
            className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {!hideNavigation && (
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Salvando..."
              : isEditing
              ? "Salvar Alterações"
              : "Cadastrar Paciente"}
          </Button>
        </div>
      )}
    </form>
  );
}
