import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUpcomingTimeBlocks } from "@/lib/queries/time-blocks";
import { TimeBlockList } from "./_components/time-block-list";
import { TimeBlockDialog } from "./_components/time-block-dialog";

export default async function TimeBlocksPage() {
  const timeBlocks = await getUpcomingTimeBlocks(90);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bloqueio de Horários
          </h1>
          <p className="text-muted-foreground">
            Bloqueie dias ou períodos específicos em que não poderá atender.
          </p>
        </div>
        <TimeBlockDialog>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Bloqueio
          </Button>
        </TimeBlockDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Próximos Bloqueios
          </CardTitle>
          <CardDescription>
            Períodos bloqueados nos próximos 90 dias. Estes horários não estarão
            disponíveis para agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimeBlockList timeBlocks={timeBlocks} />
        </CardContent>
      </Card>
    </div>
  );
}
