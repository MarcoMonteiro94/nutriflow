"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatsCard } from "@/components/ui/stats-card";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Mail,
  Phone,
  Target,
  UtensilsCrossed,
  Activity,
  FileText,
  Ruler,
} from "lucide-react";
import { PageTransition, FadeIn, StaggerList, StaggerItem } from "@/components/motion";
import { DeletePatientButton } from "../../_components/delete-patient-button";
import { SharePlanButton } from "./share-plan-button";
import { LinkAccountButton } from "./link-account-button";
import type { Patient } from "@/types/database";

interface PatientStats {
  mealPlans: number;
  appointments: number;
  measurements: number;
  anamnesis: number;
  anthropometry: number;
}

interface PatientDetailContentProps {
  patient: Patient;
  stats: PatientStats;
  linkedUserEmail: string | null;
  generateToken: () => Promise<string>;
}

export function PatientDetailContent({
  patient,
  stats,
  linkedUserEmail,
  generateToken,
}: PatientDetailContentProps) {
  const initials = patient.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const age = patient.birth_date
    ? Math.floor(
        (new Date().getTime() - new Date(patient.birth_date).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const quickActions = [
    {
      label: "Novo Plano",
      href: `/plans/new?patient=${patient.id}`,
      icon: UtensilsCrossed,
      primary: true,
    },
    {
      label: "Agendar Consulta",
      href: `/schedule/new?patient=${patient.id}`,
      icon: Calendar,
    },
    {
      label: "Registrar Medidas",
      href: `/patients/${patient.id}/measurements/new`,
      icon: Activity,
    },
    {
      label: "Nova Anamnese",
      href: `/patients/${patient.id}/anamnesis/new`,
      icon: FileText,
    },
    {
      label: "Nova Antropometria",
      href: `/patients/${patient.id}/anthropometry/new`,
      icon: Ruler,
    },
  ];

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <FadeIn direction="down" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Perfil do Paciente
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie as informações do paciente.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href={`/patients/${patient.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DeletePatientButton patientId={patient.id} patientName={patient.full_name} />
        </div>
      </FadeIn>

      {/* Quick Actions - Logo após o header */}
      <FadeIn delay={0.1}>
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                asChild
                variant={action.primary ? "default" : "outline"}
                size="sm"
                className="justify-start sm:justify-center"
              >
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Link>
              </Button>
            ))}
            <SharePlanButton
              patientId={patient.id}
              patientName={patient.full_name}
              generateToken={generateToken}
            />
            <LinkAccountButton
              patientId={patient.id}
              patientName={patient.full_name}
              patientEmail={patient.email}
              linkedUserId={patient.user_id || null}
              linkedUserEmail={linkedUserEmail}
            />
          </div>
        </div>
      </FadeIn>

      {/* Stats Cards - Grid horizontal */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Link href={`/plans?patient=${patient.id}`} className="block">
          <StatsCard
            title="Planos"
            value={stats.mealPlans}
            description="Alimentares"
            icon={UtensilsCrossed}
            iconColor="primary"
            index={0}
          />
        </Link>
        <Link href={`/patients/${patient.id}/appointments`} className="block">
          <StatsCard
            title="Consultas"
            value={stats.appointments}
            description="Realizadas"
            icon={Calendar}
            iconColor="blue"
            index={1}
          />
        </Link>
        <Link href={`/patients/${patient.id}/measurements`} className="block">
          <StatsCard
            title="Medidas"
            value={stats.measurements}
            description="Registradas"
            icon={Activity}
            iconColor="green"
            index={2}
          />
        </Link>
        <Link href={`/patients/${patient.id}/anamnesis`} className="block">
          <StatsCard
            title="Anamneses"
            value={stats.anamnesis}
            description="Registradas"
            icon={FileText}
            iconColor="purple"
            index={3}
          />
        </Link>
        <Link href={`/patients/${patient.id}/anthropometry`} className="block col-span-2 lg:col-span-1">
          <StatsCard
            title="Antropometria"
            value={stats.anthropometry}
            description="Avaliações"
            icon={Ruler}
            iconColor="amber"
            index={4}
          />
        </Link>
      </div>

      {/* Patient Info Card */}
      <FadeIn delay={0.3}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="text-xl truncate">{patient.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {age !== null && `${age} anos`}
                {age !== null && patient.gender && " • "}
                {patient.gender && `${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}`}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <StaggerList className="grid gap-4 sm:grid-cols-2">
              {patient.email && (
                <StaggerItem className="flex items-center gap-3 rounded-xl bg-accent/30 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="truncate text-sm font-medium">{patient.email}</p>
                  </div>
                </StaggerItem>
              )}
              {patient.phone && (
                <StaggerItem className="flex items-center gap-3 rounded-xl bg-accent/30 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="truncate text-sm font-medium">{patient.phone}</p>
                  </div>
                </StaggerItem>
              )}
              {patient.birth_date && (
                <StaggerItem className="flex items-center gap-3 rounded-xl bg-accent/30 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                    <p className="truncate text-sm font-medium">
                      {new Date(patient.birth_date).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </StaggerItem>
              )}
              {patient.goal && (
                <StaggerItem className="flex items-center gap-3 rounded-xl bg-accent/30 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Target className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Objetivo</p>
                    <p className="truncate text-sm font-medium">{patient.goal}</p>
                  </div>
                </StaggerItem>
              )}
            </StaggerList>

            {patient.notes && (
              <div className="mt-4 rounded-xl bg-accent/30 p-4">
                <p className="text-xs text-muted-foreground mb-2">Observações</p>
                <p className="text-sm">{patient.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </PageTransition>
  );
}
