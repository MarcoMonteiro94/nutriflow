"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Challenge, ChallengeStatus } from "@/types/database";

interface ChallengeActionsProps {
  challenge: Challenge;
}

export function ChallengeActions({ challenge }: ChallengeActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "activate" | "complete" | "cancel" | null;
  }>({ open: false, action: null });

  async function updateStatus(newStatus: ChallengeStatus) {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("challenges")
        .update({ status: newStatus })
        .eq("id", challenge.id);

      if (error) throw error;

      const messages = {
        active: "Desafio ativado com sucesso!",
        completed: "Desafio marcado como concluído!",
        cancelled: "Desafio cancelado.",
      };

      toast.success(messages[newStatus as keyof typeof messages]);
      router.refresh();
    } catch (error) {
      console.error("Error updating challenge status:", error);
      toast.error("Erro ao atualizar status do desafio");
    } finally {
      setIsLoading(false);
      setConfirmDialog({ open: false, action: null });
    }
  }

  function handleAction(action: "activate" | "complete" | "cancel") {
    setConfirmDialog({ open: true, action });
  }

  function confirmAction() {
    switch (confirmDialog.action) {
      case "activate":
        updateStatus("active");
        break;
      case "complete":
        updateStatus("completed");
        break;
      case "cancel":
        updateStatus("cancelled");
        break;
    }
  }

  const dialogConfig = {
    activate: {
      title: "Ativar Desafio",
      description:
        "Ao ativar o desafio, os pacientes poderão fazer check-ins diários. Deseja continuar?",
      confirmText: "Ativar",
      confirmVariant: "default" as const,
    },
    complete: {
      title: "Concluir Desafio",
      description:
        "Ao marcar como concluído, os pacientes que completaram todos os check-ins receberão o badge. Deseja continuar?",
      confirmText: "Concluir",
      confirmVariant: "default" as const,
    },
    cancel: {
      title: "Cancelar Desafio",
      description:
        "Esta ação não pode ser desfeita. Os participantes não poderão mais fazer check-ins. Deseja continuar?",
      confirmText: "Cancelar Desafio",
      confirmVariant: "destructive" as const,
    },
  };

  const currentConfig = confirmDialog.action
    ? dialogConfig[confirmDialog.action]
    : null;

  const canActivate = challenge.status === "draft";
  const canComplete = challenge.status === "active";
  const canCancel = challenge.status !== "cancelled" && challenge.status !== "completed";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canActivate && (
            <DropdownMenuItem onClick={() => handleAction("activate")}>
              <Play className="h-4 w-4 mr-2" />
              Ativar Desafio
            </DropdownMenuItem>
          )}
          {canComplete && (
            <DropdownMenuItem onClick={() => handleAction("complete")}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Concluir Desafio
            </DropdownMenuItem>
          )}
          {canCancel && (
            <>
              {(canActivate || canComplete) && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => handleAction("cancel")}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Desafio
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {currentConfig?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isLoading}
              className={
                currentConfig?.confirmVariant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentConfig?.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
