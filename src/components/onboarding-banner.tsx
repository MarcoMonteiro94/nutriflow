"use client";

import { useState, useEffect } from "react";
import { X, Users, CalendarDays, ClipboardList, Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OrgRole } from "@/types/database";

const onboardingMessages: Record<OrgRole, { title: string; description: string; icon: React.ElementType }> = {
  admin: {
    title: "Bem-vindo(a), Administrador(a)!",
    description: "Comece convidando sua equipe em Organização > Membros. Gerencie nutricionistas, recepcionistas e pacientes da sua clínica.",
    icon: Users,
  },
  nutri: {
    title: "Bem-vindo(a), Nutricionista!",
    description: "Comece cadastrando seus pacientes e criando planos alimentares personalizados.",
    icon: Utensils,
  },
  receptionist: {
    title: "Bem-vindo(a), Recepcionista!",
    description: "Gerencie a agenda da clínica, cadastre pacientes e organize os agendamentos.",
    icon: CalendarDays,
  },
  patient: {
    title: "Bem-vindo(a) ao NutriFlow!",
    description: "Aqui você acompanha seu plano alimentar, consultas e evolução. Explore o menu para ver suas informações.",
    icon: ClipboardList,
  },
};

interface OnboardingBannerProps {
  userId: string;
  role: OrgRole;
}

function getStorageKey(userId: string) {
  return `nutriflow_onboarding_seen_${userId}`;
}

export function OnboardingBanner({ userId, role }: OnboardingBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = getStorageKey(userId);
    const seen = localStorage.getItem(key);
    if (!seen) {
      setVisible(true);
    }
  }, [userId]);

  function handleDismiss() {
    const key = getStorageKey(userId);
    localStorage.setItem(key, new Date().toISOString());
    setVisible(false);
  }

  if (!visible) return null;

  const message = onboardingMessages[role];
  if (!message) return null;

  const Icon = message.icon;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-soft mb-6" data-testid="onboarding-banner">
      <CardContent className="flex items-start gap-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{message.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{message.description}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={handleDismiss}
          aria-label="Fechar mensagem de boas-vindas"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
