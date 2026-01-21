"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, User } from "lucide-react";
import Link from "next/link";
import { PageTransition, StaggerList, StaggerItem, FadeIn, MotionCard } from "@/components/motion";
import type { MealPlan } from "@/types/database";

type MealPlanWithPatient = MealPlan & {
  patients: {
    id: string;
    full_name: string;
  } | null;
};

interface PlansListProps {
  mealPlans: MealPlanWithPatient[];
}

function getStatusLabel(status: "active" | "archived") {
  switch (status) {
    case "active":
      return { label: "Ativo", color: "bg-green-100 text-green-800" };
    case "archived":
      return { label: "Arquivado", color: "bg-gray-100 text-gray-800" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800" };
  }
}

export function PlansList({ mealPlans }: PlansListProps) {
  if (mealPlans.length === 0) {
    return (
      <PageTransition>
        <FadeIn>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                Nenhum plano cadastrado
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Crie o primeiro plano alimentar para um paciente.
              </p>
              <Button asChild className="mt-4">
                <Link href="/plans/new">Criar Plano</Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mealPlans.map((plan) => {
          const status = getStatusLabel(plan.status);
          return (
            <StaggerItem key={plan.id}>
              <MotionCard>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">
                      {plan.title || "Plano sem título"}
                    </CardTitle>
                    <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {plan.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <Link
                      href={`/patients/${plan.patients?.id}`}
                      className="hover:underline"
                    >
                      {plan.patients?.full_name ?? "Paciente não encontrado"}
                    </Link>
                  </div>
                  {plan.starts_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(plan.starts_at).toLocaleDateString("pt-BR")}
                        {plan.ends_at && ` - ${new Date(plan.ends_at).toLocaleDateString("pt-BR")}`}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/plans/${plan.id}`}>
                        Ver Plano
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/plans/${plan.id}/edit`}>
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </MotionCard>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </PageTransition>
  );
}
