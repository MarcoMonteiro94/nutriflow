"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Patient, MealPlan } from "@/types/database";

interface MealPlanFormProps {
  patients: Patient[];
  defaultPatientId?: string;
  planId?: string;
  initialData?: Partial<MealPlan>;
}

export function MealPlanForm({
  patients,
  defaultPatientId,
  planId,
  initialData,
}: MealPlanFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patientId, setPatientId] = useState(
    initialData?.patient_id || defaultPatientId || ""
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState<"active" | "archived">(initialData?.status || "active");
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.starts_at ? new Date(initialData.starts_at) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.ends_at ? new Date(initialData.ends_at) : undefined
  );

  const isEditing = !!planId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!patientId) {
      setError("Selecione um paciente.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Você precisa estar logado para criar planos.");
        setIsSubmitting(false);
        return;
      }

      const planData = {
        patient_id: patientId,
        nutri_id: user.id,
        title: title || null,
        description: description || null,
        status: status,
        starts_at: startDate ? format(startDate, "yyyy-MM-dd") : null,
        ends_at: endDate ? format(endDate, "yyyy-MM-dd") : null,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("meal_plans")
          .update(planData)
          .eq("id", planId);

        if (updateError) {
          throw updateError;
        }

        router.push(`/plans/${planId}/edit`);
      } else {
        const { data, error: insertError } = await supabase
          .from("meal_plans")
          .insert(planData)
          .select("id")
          .single();

        if (insertError || !data) {
          throw insertError || new Error("Failed to create plan");
        }

        // Redirect to the meal plan editor
        router.push(`/plans/${data.id}/edit`);
      }

      router.refresh();
    } catch (err) {
      console.error("Error saving plan:", err);
      setError("Erro ao salvar plano. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="patient">Paciente *</Label>
        <Select value={patientId} onValueChange={setPatientId}>
          <SelectTrigger id="patient">
            <SelectValue placeholder="Selecione um paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {patients.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum paciente cadastrado.{" "}
            <Link href="/patients/new" className="text-primary hover:underline">
              Cadastre um paciente
            </Link>{" "}
            primeiro.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Plano de Emagrecimento - Janeiro 2026"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva os objetivos e recomendações do plano"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as "active" | "archived")}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data de Término</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || patients.length === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar Alterações" : "Criar Plano"}
        </Button>
      </div>
    </form>
  );
}
