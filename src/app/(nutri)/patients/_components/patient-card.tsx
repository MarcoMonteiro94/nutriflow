import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Phone, Target } from "lucide-react";
import Link from "next/link";
import type { Patient } from "@/types/database";

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
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

  return (
    <Card className="hover:shadow-soft-lg transition-all">
      <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2 sm:gap-4 sm:p-6 sm:pb-2">
        <Avatar className="h-10 w-10 rounded-lg sm:h-12 sm:w-12 sm:rounded-xl">
          <AvatarFallback className="bg-primary/15 text-primary rounded-lg sm:rounded-xl text-sm font-semibold sm:text-base">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
          <Link
            href={`/patients/${patient.id}`}
            className="block truncate font-semibold text-sm sm:text-base hover:underline"
          >
            {patient.full_name}
          </Link>
          {age !== null && (
            <p className="text-xs sm:text-sm text-muted-foreground">{age} anos</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0 sm:space-y-3 sm:p-6 sm:pt-0">
        {patient.email && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">{patient.email}</span>
          </div>
        )}
        {patient.phone && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
            <span>{patient.phone}</span>
          </div>
        )}
        {patient.goal && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Target className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">{patient.goal}</span>
          </div>
        )}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            Cadastrado em{" "}
            {new Date(patient.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>

        <div className="flex gap-2 pt-1 sm:pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
            <Link href={`/patients/${patient.id}`}>Perfil</Link>
          </Button>
          <Button asChild size="sm" className="flex-1 text-xs sm:text-sm">
            <Link href={`/patients/${patient.id}/plan`}>Plano</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
