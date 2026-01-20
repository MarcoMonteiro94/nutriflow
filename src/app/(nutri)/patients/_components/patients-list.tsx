"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { PageTransition, StaggerList, StaggerItem, FadeIn } from "@/components/motion";
import { AnimatedPatientCard } from "./animated-patient-card";
import type { Patient } from "@/types/database";

interface PatientsListProps {
  patients: Patient[];
  searchQuery?: string;
}

export function PatientsList({ patients, searchQuery }: PatientsListProps) {
  return (
    <PageTransition className="space-y-6">
      {/* Patient List */}
      {patients.length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchQuery ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                {searchQuery
                  ? `Não encontramos pacientes com "${searchQuery}". Tente outro termo.`
                  : "Comece cadastrando seu primeiro paciente para gerenciar seus atendimentos."}
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4">
                  <Link href="/patients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Paciente
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <StaggerItem key={patient.id}>
              <AnimatedPatientCard patient={patient} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
