"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PhaseBuilder, createEmptyPhase } from "./phase-builder";
import { GoalForm, createEmptyGoal } from "./goal-form";
import { TemplateSelector } from "./template-selector";
import type { ChallengeTemplate } from "@/lib/challenges/templates";
import type {
  Challenge,
  PhaseFormData,
  GoalFormData,
} from "@/types/database";

interface ChallengeFormV2Props {
  challenge?: Challenge;
  phases?: PhaseFormData[];
  goals?: GoalFormData[];
}

export function ChallengeFormV2({
  challenge,
  phases: initialPhases,
  goals: initialGoals,
}: ChallengeFormV2Props) {
  const router = useRouter();
  const supabase = createClient();

  const isEditing = !!challenge;

  // Step: template selection or form
  const [step, setStep] = useState<"template" | "form">(
    isEditing ? "form" : "template"
  );

  // Basic fields
  const [title, setTitle] = useState(challenge?.title ?? "");
  const [description, setDescription] = useState(challenge?.description ?? "");

  // Structure toggle
  const [usePhases, setUsePhases] = useState(
    initialPhases ? initialPhases.length > 0 : false
  );

  // Phases (when usePhases = true)
  const [phases, setPhases] = useState<PhaseFormData[]>(
    initialPhases && initialPhases.length > 0
      ? initialPhases
      : [createEmptyPhase()]
  );

  // Direct goals (when usePhases = false)
  const [directGoals, setDirectGoals] = useState<GoalFormData[]>(
    initialGoals && initialGoals.length > 0 ? initialGoals : [createEmptyGoal()]
  );

  const [isLoading, setIsLoading] = useState(false);

  // Handle template selection
  function handleTemplateSelect(template: ChallengeTemplate) {
    setTitle(template.name);
    setDescription(template.description);

    if (template.phases.length > 0) {
      setUsePhases(true);
      setPhases(
        template.phases.map((p, i) => ({
          title: p.title,
          description: p.description,
          completion_threshold: p.completion_threshold,
          goals: p.goals.map((g, j) => ({
            title: g.title,
            description: g.description,
            type: g.type,
            metric_type: g.metric_type,
            duration_days: g.duration_days,
          })),
        }))
      );
      setDirectGoals([createEmptyGoal()]);
    } else if (template.goals && template.goals.length > 0) {
      setUsePhases(false);
      setDirectGoals(
        template.goals.map((g) => ({
          title: g.title,
          description: g.description,
          type: g.type,
          metric_type: g.metric_type,
          duration_days: g.duration_days,
        }))
      );
      setPhases([createEmptyPhase()]);
    }

    setStep("form");
  }

  function handleSkipTemplate() {
    setStep("form");
  }

  function addDirectGoal() {
    setDirectGoals([...directGoals, createEmptyGoal()]);
  }

  function updateDirectGoal(index: number, goal: GoalFormData) {
    const updated = [...directGoals];
    updated[index] = goal;
    setDirectGoals(updated);
  }

  function removeDirectGoal(index: number) {
    setDirectGoals(directGoals.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validate basic fields
    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    // Validate structure
    if (usePhases) {
      if (phases.length === 0) {
        toast.error("Adicione pelo menos uma fase");
        return;
      }

      // Validate each phase has title and at least one goal
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        if (!phase.title.trim()) {
          toast.error(`A Fase ${i + 1} precisa de um título`);
          return;
        }
        if (phase.goals.length === 0) {
          toast.error(`A Fase ${i + 1} precisa de pelo menos uma meta`);
          return;
        }
        // Validate each goal in phase
        for (let j = 0; j < phase.goals.length; j++) {
          const goal = phase.goals[j];
          if (!goal.title.trim()) {
            toast.error(`Meta ${j + 1} da Fase ${i + 1} precisa de um título`);
            return;
          }
          if (goal.type === "metric" && !goal.metric_type) {
            toast.error(
              `Meta ${j + 1} da Fase ${i + 1} precisa de um tipo de métrica`
            );
            return;
          }
        }
      }
    } else {
      if (directGoals.length === 0) {
        toast.error("Adicione pelo menos uma meta");
        return;
      }

      // Validate each direct goal
      for (let i = 0; i < directGoals.length; i++) {
        const goal = directGoals[i];
        if (!goal.title.trim()) {
          toast.error(`Meta ${i + 1} precisa de um título`);
          return;
        }
        if (goal.type === "metric" && !goal.metric_type) {
          toast.error(`Meta ${i + 1} precisa de um tipo de métrica`);
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Você precisa estar logado");
        router.push("/auth/login");
        return;
      }

      if (isEditing) {
        // TODO: Update existing challenge
        toast.error("Edição ainda não implementada");
        return;
      }

      // Create new challenge
      const { data: newChallenge, error: challengeError } = await supabase
        .from("challenges")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          nutri_id: user.id,
          status: "draft",
          start_date: new Date().toISOString().split("T")[0], // Default to today
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Default to 30 days from now
        })
        .select("id")
        .single();

      if (challengeError || !newChallenge) {
        console.error("Error creating challenge:", challengeError);
        toast.error("Erro ao criar desafio");
        return;
      }

      const challengeId = newChallenge.id;

      // Create phases and goals
      if (usePhases) {
        for (let i = 0; i < phases.length; i++) {
          const phase = phases[i];

          // Create phase
          const { data: newPhase, error: phaseError } = await supabase
            .from("challenge_phases")
            .insert({
              challenge_id: challengeId,
              title: phase.title.trim(),
              description: phase.description?.trim() || null,
              order_index: i,
              completion_threshold: phase.completion_threshold,
              status: i === 0 ? "active" : "locked",
            })
            .select("id")
            .single();

          if (phaseError || !newPhase) {
            console.error("Error creating phase:", phaseError);
            toast.error(`Erro ao criar Fase ${i + 1}`);
            return;
          }

          const phaseId = newPhase.id;

          // Create goals for this phase
          for (let j = 0; j < phase.goals.length; j++) {
            const goal = phase.goals[j];

            const { error: goalError } = await supabase
              .from("challenge_goals")
              .insert({
                challenge_id: challengeId,
                phase_id: phaseId,
                title: goal.title.trim(),
                description: goal.description?.trim() || null,
                type: goal.type,
                metric_type: goal.type === "metric" ? goal.metric_type : null,
                duration_days: goal.duration_days,
                order_index: j,
              });

            if (goalError) {
              console.error("Error creating goal:", goalError);
              toast.error(`Erro ao criar Meta ${j + 1} da Fase ${i + 1}`);
              return;
            }
          }
        }
      } else {
        // Create direct goals (no phases)
        for (let i = 0; i < directGoals.length; i++) {
          const goal = directGoals[i];

          const { error: goalError } = await supabase
            .from("challenge_goals")
            .insert({
              challenge_id: challengeId,
              phase_id: null,
              title: goal.title.trim(),
              description: goal.description?.trim() || null,
              type: goal.type,
              metric_type: goal.type === "metric" ? goal.metric_type : null,
              duration_days: goal.duration_days,
              order_index: i,
            });

          if (goalError) {
            console.error("Error creating goal:", goalError);
            toast.error(`Erro ao criar Meta ${i + 1}`);
            return;
          }
        }
      }

      toast.success("Desafio criado com sucesso!");
      router.push(`/challenges/${challengeId}`);
      router.refresh();
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error("Erro ao salvar desafio");
    } finally {
      setIsLoading(false);
    }
  }

  // Show template selector if in template step
  if (step === "template") {
    return (
      <TemplateSelector
        onSelect={handleTemplateSelect}
        onSkip={handleSkipTemplate}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Informações Básicas</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Título do Desafio *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Reeducação Alimentar 90 dias"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o objetivo do desafio..."
            rows={3}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Structure Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-1">
            <Label htmlFor="use-phases" className="text-base font-medium">
              Usar Fases
            </Label>
            <p className="text-sm text-muted-foreground">
              Organize o desafio em fases sequenciais com metas progressivas
            </p>
          </div>
          <Switch
            id="use-phases"
            checked={usePhases}
            onCheckedChange={setUsePhases}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Phases or Direct Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {usePhases ? "Fases do Desafio" : "Metas do Desafio"}
        </h2>

        {usePhases ? (
          <PhaseBuilder phases={phases} onChange={setPhases} />
        ) : (
          <div className="space-y-4">
            {directGoals.map((goal, index) => (
              <GoalForm
                key={index}
                goal={goal}
                index={index}
                onChange={updateDirectGoal}
                onRemove={removeDirectGoal}
                canRemove={directGoals.length > 1}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addDirectGoal}
              className="w-full"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Meta
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar Alterações" : "Criar Desafio"}
        </Button>
      </div>
    </form>
  );
}
