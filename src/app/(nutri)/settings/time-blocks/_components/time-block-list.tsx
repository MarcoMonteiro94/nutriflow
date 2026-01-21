"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Trash2, Loader2, Briefcase, Palmtree, PartyPopper, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { NutriTimeBlock, BlockType } from "@/types/database";

interface TimeBlockListProps {
  timeBlocks: NutriTimeBlock[];
}

const BLOCK_TYPE_CONFIG: Record<
  BlockType,
  { label: string; icon: typeof Briefcase; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  personal: { label: "Pessoal", icon: Briefcase, variant: "default" },
  holiday: { label: "Feriado", icon: PartyPopper, variant: "secondary" },
  vacation: { label: "Férias", icon: Palmtree, variant: "outline" },
  other: { label: "Outro", icon: MoreHorizontal, variant: "outline" },
};

export function TimeBlockList({ timeBlocks }: TimeBlockListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("nutri_time_blocks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      router.refresh();
    } catch (err) {
      console.error("Error deleting time block:", err);
    } finally {
      setDeletingId(null);
    }
  }

  if (timeBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhum bloqueio configurado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Adicione bloqueios para férias, feriados ou compromissos pessoais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeBlocks.map((block) => {
        const config = BLOCK_TYPE_CONFIG[block.block_type];
        const Icon = config.icon;
        const startDate = new Date(block.start_datetime);
        const endDate = new Date(block.end_datetime);
        const isMultiDay =
          startDate.toDateString() !== endDate.toDateString();

        return (
          <div
            key={block.id}
            className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-soft"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{block.title}</span>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isMultiDay ? (
                    <>
                      {format(startDate, "d 'de' MMMM", { locale: ptBR })} até{" "}
                      {format(endDate, "d 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </>
                  ) : (
                    <>
                      {format(startDate, "d 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                      {" • "}
                      {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                    </>
                  )}
                </p>
                {block.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {block.notes}
                  </p>
                )}
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={deletingId === block.id}
                >
                  {deletingId === block.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Remover bloqueio</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover bloqueio?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O bloqueio &quot;{block.title}&quot; será removido e os
                    horários ficarão disponíveis para agendamento novamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(block.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      })}
    </div>
  );
}
