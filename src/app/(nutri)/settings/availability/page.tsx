import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { getAvailability } from "@/lib/queries/availability";
import { WeekSchedule } from "./_components/week-schedule";

export default async function AvailabilityPage() {
  const availability = await getAvailability();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configurar Disponibilidade
        </h1>
        <p className="text-muted-foreground">
          Defina seus horários de atendimento para cada dia da semana.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de Atendimento
          </CardTitle>
          <CardDescription>
            Configure os dias e horários em que você está disponível para
            atendimentos. Estes horários serão usados para validar novos
            agendamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeekSchedule initialAvailability={availability} />
        </CardContent>
      </Card>
    </div>
  );
}
