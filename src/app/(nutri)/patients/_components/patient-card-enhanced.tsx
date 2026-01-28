"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Target,
  ChevronRight,
  Clock
} from "lucide-react";
import type { Patient } from "@/types/database";

interface PatientCardEnhancedProps {
  patient: Patient;
  index?: number;
  isReceptionist?: boolean;
}

export function PatientCardEnhanced({ patient, index = 0, isReceptionist }: PatientCardEnhancedProps) {
  const router = useRouter();

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

  // Check if patient is new (created in last 7 days)
  const isNew = new Date().getTime() - new Date(patient.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  function handleCardClick() {
    router.push(`/patients/${patient.id}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <div
        onClick={handleCardClick}
        className="group cursor-pointer relative bg-card rounded-2xl border shadow-soft p-4 sm:p-5 transition-all duration-300 hover:shadow-soft-lg hover:border-primary/30 hover:-translate-y-0.5"
      >
        {/* New badge - subtle */}
        {isNew && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium shadow-sm">
              Novo
            </span>
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Avatar - consistent primary color */}
          <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center font-semibold text-base sm:text-lg text-primary transition-transform group-hover:scale-105">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                  {patient.full_name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {age !== null && (
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {age} anos
                    </span>
                  )}
                  {age !== null && patient.gender && (
                    <span className="text-muted-foreground/50">•</span>
                  )}
                  {patient.gender && (
                    <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                      {patient.gender}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Contact & Goal */}
            <div className="mt-3 space-y-1.5">
              {patient.email && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.goal && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Target className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{patient.goal}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(patient.created_at).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs rounded-full hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/patients/${patient.id}`);
                  }}
                >
                  Perfil
                </Button>
                {!isReceptionist && (
                  <Button
                    size="sm"
                    className="h-7 px-2.5 text-xs rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/plans?patient=${patient.id}`);
                    }}
                  >
                    Plano
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
