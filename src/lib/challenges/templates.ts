import type { GoalType, MetricType } from "@/types/database";

export interface TemplateGoal {
  title: string;
  description?: string;
  type: GoalType;
  metric_type?: MetricType;
  duration_days: number;
}

export interface TemplatePhase {
  title: string;
  description?: string;
  completion_threshold: number;
  goals: TemplateGoal[];
}

export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  icon: "Flame" | "Camera" | "Scale" | "Trophy" | "Target" | "Heart";
  color: "amber" | "sky" | "emerald" | "purple" | "rose" | "orange";
  phases: TemplatePhase[];
  goals?: TemplateGoal[];
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: "habit_21",
    name: "21 Dias de Hábito",
    description: "Desafio simples de check-in diário para formar um hábito",
    icon: "Flame",
    color: "amber",
    phases: [],
    goals: [
      {
        title: "Check-in diário",
        description: "Confirme que praticou o hábito hoje",
        type: "checkin",
        duration_days: 21,
      },
    ],
  },
  {
    id: "photo_diary_14",
    name: "Diário Fotográfico 14 Dias",
    description: "Registre suas refeições principais com fotos",
    icon: "Camera",
    color: "sky",
    phases: [],
    goals: [
      {
        title: "Foto do almoço",
        description: "Tire uma foto do seu prato de almoço",
        type: "photo",
        duration_days: 14,
      },
    ],
  },
  {
    id: "weight_tracking",
    name: "Controle de Peso Semanal",
    description: "Acompanhe seu peso semanalmente por 8 semanas",
    icon: "Scale",
    color: "emerald",
    phases: [],
    goals: [
      {
        title: "Registro de peso",
        description: "Registre seu peso (idealmente no mesmo horário)",
        type: "metric",
        metric_type: "weight",
        duration_days: 56,
      },
    ],
  },
  {
    id: "reeducacao_90",
    name: "Reeducação Alimentar 90 Dias",
    description: "Programa completo em 3 fases para mudança de hábitos",
    icon: "Trophy",
    color: "purple",
    phases: [
      {
        title: "Fase 1: Consciência",
        description: "Tome consciência dos seus hábitos atuais",
        completion_threshold: 80,
        goals: [
          {
            title: "Foto das refeições",
            description: "Registre o que você come",
            type: "photo",
            duration_days: 21,
          },
          {
            title: "Registro de peso inicial",
            type: "metric",
            metric_type: "weight",
            duration_days: 7,
          },
        ],
      },
      {
        title: "Fase 2: Ação",
        description: "Implemente as mudanças recomendadas",
        completion_threshold: 80,
        goals: [
          {
            title: "Check-in do plano alimentar",
            description: "Confirme que seguiu o plano",
            type: "checkin",
            duration_days: 30,
          },
          {
            title: "Registro de cintura",
            type: "metric",
            metric_type: "waist",
            duration_days: 14,
          },
        ],
      },
      {
        title: "Fase 3: Manutenção",
        description: "Consolide os novos hábitos",
        completion_threshold: 100,
        goals: [
          {
            title: "Check-in diário",
            type: "checkin",
            duration_days: 30,
          },
          {
            title: "Peso final",
            type: "metric",
            metric_type: "weight",
            duration_days: 7,
          },
        ],
      },
    ],
  },
];

// Helper to count total goals in a template
export function getTemplateGoalsCount(template: ChallengeTemplate): number {
  if (template.phases.length > 0) {
    return template.phases.reduce((acc, phase) => acc + phase.goals.length, 0);
  }
  return template.goals?.length || 0;
}

// Helper to get template duration in days
export function getTemplateDuration(template: ChallengeTemplate): number {
  if (template.phases.length > 0) {
    return template.phases.reduce(
      (acc, phase) =>
        acc + Math.max(...phase.goals.map((g) => g.duration_days)),
      0
    );
  }
  if (template.goals && template.goals.length > 0) {
    return Math.max(...template.goals.map((g) => g.duration_days));
  }
  return 0;
}
