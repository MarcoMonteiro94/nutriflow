import { Clock, CalendarClock, Info } from "lucide-react";
import { getAvailability } from "@/lib/queries/availability";
import { WeekSchedule } from "./_components/week-schedule";

export default async function AvailabilityPage() {
  const availability = await getAvailability();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-card via-card to-primary/[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/[0.03] to-transparent blur-3xl" />

        <div className="relative px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
                <CalendarClock className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Configurar Disponibilidade
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                  Defina seus horários de atendimento para cada dia da semana.
                  Estes horários serão utilizados para validar novos agendamentos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-sky-200/50 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-950/20 p-4">
            <div className="shrink-0 mt-0.5">
              <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-sky-900 dark:text-sky-100">
                Como funciona?
              </p>
              <p className="text-sky-700 dark:text-sky-300">
                Adicione múltiplos blocos de horário para cada dia. Por exemplo,
                você pode configurar atendimentos das 08:00 às 12:00 e das 14:00 às 18:00,
                excluindo o horário de almoço.
              </p>
            </div>
          </div>

          {/* Week Schedule */}
          <WeekSchedule initialAvailability={availability} />
        </div>
      </div>
    </div>
  );
}
