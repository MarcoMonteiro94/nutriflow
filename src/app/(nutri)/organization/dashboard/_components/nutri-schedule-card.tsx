import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import type { NutriWithAppointments } from "@/lib/queries/organization";
import type { OrgRole } from "@/types/database";

interface NutriScheduleCardProps {
  nutri: NutriWithAppointments;
}

const roleLabels: Record<OrgRole, string> = {
  admin: "Admin",
  nutri: "Nutri",
  receptionist: "Recep.",
  patient: "Paciente",
};

export function NutriScheduleCard({ nutri }: NutriScheduleCardProps) {
  const hasAppointments = nutri.todayAppointmentsCount > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{nutri.profiles.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{nutri.profiles.email}</p>
            </div>
          </div>
          <Badge variant="secondary">{roleLabels[nutri.role]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                <strong>{nutri.todayAppointmentsCount}</strong> consulta{nutri.todayAppointmentsCount !== 1 ? "s" : ""} hoje
              </span>
            </div>
            {nutri.inProgressCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Clock className="h-4 w-4" />
                <span>
                  <strong>{nutri.inProgressCount}</strong> em andamento
                </span>
              </div>
            )}
          </div>

          {!hasAppointments && (
            <p className="text-sm text-muted-foreground italic">
              Nenhuma consulta agendada para hoje
            </p>
          )}

          {/* Future: Add link to view nutri's full schedule */}
          {/* <Link href={`/organization/schedule?nutri=${nutri.user_id}`}>
            <Button variant="outline" size="sm" className="w-full">
              Ver Agenda Completa
            </Button>
          </Link> */}
        </div>
      </CardContent>
    </Card>
  );
}
