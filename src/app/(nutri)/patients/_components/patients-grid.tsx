"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Users, Search } from "lucide-react";
import Link from "next/link";
import { PatientCardEnhanced } from "./patient-card-enhanced";
import type { Patient } from "@/types/database";

interface PatientsGridProps {
  patients: Patient[];
  searchQuery?: string;
  isReceptionist?: boolean;
}

export function PatientsGrid({ patients, searchQuery, isReceptionist }: PatientsGridProps) {
  if (patients.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card rounded-2xl border shadow-soft p-8 sm:p-12"
      >
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          {/* Illustration */}
          <div className="relative mb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted/50 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center">
                {searchQuery ? (
                  <Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/60" />
                ) : (
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/60" />
                )}
              </div>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-semibold mb-2">
            {searchQuery ? "Nenhum paciente encontrado" : "Comece sua jornada"}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            {searchQuery
              ? `Não encontramos pacientes com "${searchQuery}". Tente outro termo de busca.`
              : "Cadastre seu primeiro paciente para começar a acompanhar suas consultas e planos alimentares."}
          </p>

          {!searchQuery && (
            <Button asChild className="rounded-full" size="lg">
              <Link href="/patients/new">
                <Plus className="mr-2 h-5 w-5" />
                Cadastrar Primeiro Paciente
              </Link>
            </Button>
          )}

          {searchQuery && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/patients">
                Limpar busca
              </Link>
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
      {patients.map((patient, index) => (
        <PatientCardEnhanced
          key={patient.id}
          patient={patient}
          index={index}
          isReceptionist={isReceptionist}
        />
      ))}
    </div>
  );
}
