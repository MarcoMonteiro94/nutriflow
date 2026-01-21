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
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12 rounded-xl">
          <AvatarFallback className="bg-primary/15 text-primary rounded-xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <Link
            href={`/patients/${patient.id}`}
            className="font-semibold hover:underline"
          >
            {patient.full_name}
          </Link>
          {age !== null && (
            <p className="text-sm text-muted-foreground">{age} anos</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {patient.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{patient.email}</span>
          </div>
        )}
        {patient.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{patient.phone}</span>
          </div>
        )}
        {patient.goal && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="truncate">{patient.goal}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            Cadastrado em{" "}
            {new Date(patient.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/patients/${patient.id}`}>Ver Perfil</Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link href={`/patients/${patient.id}/plan`}>Ver Plano</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
