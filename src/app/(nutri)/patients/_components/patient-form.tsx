"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/types/database";

interface PatientFormProps {
  patient?: Patient;
}

export function PatientForm({ patient }: PatientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!patient;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Você precisa estar logado para cadastrar pacientes.");
      setIsLoading(false);
      return;
    }

    const patientData = {
      full_name: formData.get("full_name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      birth_date: (formData.get("birth_date") as string) || null,
      gender: (formData.get("gender") as string) || null,
      goal: (formData.get("goal") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("patients")
        .update(patientData)
        .eq("id", patient.id);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      router.push(`/patients/${patient.id}`);
    } else {
      const { data, error: insertError } = await supabase
        .from("patients")
        .insert({
          ...patientData,
          nutri_id: user.id,
        })
        .select("id")
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? "Erro ao criar paciente");
        setIsLoading(false);
        return;
      }

      router.push(`/patients/${data.id}`);
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
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
            defaultValue={patient?.phone ?? ""}
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Selecione...</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
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
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

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
    </form>
  );
}
