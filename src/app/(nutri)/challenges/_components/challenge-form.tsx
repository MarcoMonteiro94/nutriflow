"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Challenge } from "@/types/database";

interface ChallengeFormProps {
  challenge?: Challenge;
}

export function ChallengeForm({ challenge }: ChallengeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!challenge;

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(challenge?.title ?? "");
  const [description, setDescription] = useState(challenge?.description ?? "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    challenge?.start_date ? new Date(challenge.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    challenge?.end_date ? new Date(challenge.end_date) : undefined
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Digite o título do desafio");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Selecione as datas de início e fim");
      return;
    }

    if (endDate < startDate) {
      toast.error("A data de fim deve ser posterior à data de início");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const challengeData = {
        title: title.trim(),
        description: description.trim() || null,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        nutri_id: user.id,
        status: "draft" as const,
      };

      if (isEditing && challenge) {
        const { error } = await supabase
          .from("challenges")
          .update(challengeData)
          .eq("id", challenge.id);

        if (error) throw error;
        toast.success("Desafio atualizado com sucesso!");
        router.push(`/challenges/${challenge.id}`);
      } else {
        const { data, error } = await supabase
          .from("challenges")
          .insert(challengeData)
          .select("id")
          .single();

        if (error) throw error;
        toast.success("Desafio criado com sucesso!");
        router.push(`/challenges/${(data as { id: string }).id}`);
      }

      router.refresh();
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error("Erro ao salvar desafio");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ex: Desafio 21 Dias"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o objetivo do desafio..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Data de Início <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate
                  ? format(startDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date);
                  if (date && (!endDate || endDate < date)) {
                    setEndDate(addDays(date, 21));
                  }
                }}
                locale={ptBR}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>
            Data de Fim <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate
                  ? format(endDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                locale={ptBR}
                disabled={(date) =>
                  date < (startDate ?? new Date())
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar Alterações" : "Criar Desafio"}
        </Button>
      </div>
    </form>
  );
}
