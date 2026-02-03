"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CHALLENGE_TEMPLATES,
  getTemplateGoalsCount,
  getTemplateDuration,
  type ChallengeTemplate,
} from "@/lib/challenges/templates";
import {
  Flame,
  Camera,
  Scale,
  Trophy,
  Target,
  Heart,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  Flame,
  Camera,
  Scale,
  Trophy,
  Target,
  Heart,
  FileText,
} as const;

const COLOR_CLASSES = {
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  sky: {
    bg: "bg-sky-100",
    text: "text-sky-600",
    border: "border-sky-200",
  },
  emerald: {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  rose: {
    bg: "bg-rose-100",
    text: "text-rose-600",
    border: "border-rose-200",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
  },
} as const;

interface TemplateSelectorProps {
  onSelect: (template: ChallengeTemplate) => void;
  onSkip: () => void;
}

export function TemplateSelector({ onSelect, onSkip }: TemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTemplate = selectedId
    ? CHALLENGE_TEMPLATES.find((t) => t.id === selectedId)
    : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Escolha um template</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comece com um modelo pronto ou crie do zero
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CHALLENGE_TEMPLATES.map((template) => {
          const Icon = ICONS[template.icon] || FileText;
          const colors = COLOR_CLASSES[template.color];
          const isSelected = selectedId === template.id;
          const goalsCount = getTemplateGoalsCount(template);
          const duration = getTemplateDuration(template);

          return (
            <Card
              key={template.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                isSelected && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setSelectedId(template.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      colors.bg,
                      colors.text
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {template.phases.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {template.phases.length} fases
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {goalsCount} {goalsCount === 1 ? "meta" : "metas"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {duration} dias
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onSkip}>
          Criar do zero
        </Button>
        <Button
          className="flex-1"
          disabled={!selectedTemplate}
          onClick={() => {
            if (selectedTemplate) {
              onSelect(selectedTemplate);
            }
          }}
        >
          Usar template
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
