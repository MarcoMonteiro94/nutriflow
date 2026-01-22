"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

interface DangerZoneProps {
  organizationId: string;
  organizationName: string;
}

export function DangerZone({ organizationId, organizationName }: DangerZoneProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === organizationName;

  async function handleDelete() {
    if (!canDelete) return;

    setIsDeleting(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado");
      setIsDeleting(false);
      return;
    }

    // Verify user is the owner
    const { data: org } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", organizationId)
      .single();

    if (!org || org.owner_id !== user.id) {
      setError("Apenas o proprietário pode excluir a organização");
      setIsDeleting(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", organizationId);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      return;
    }

    router.push("/organization");
    router.refresh();
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
        <CardDescription>
          Ações irreversíveis que afetam toda a organização.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Clínica
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Clínica</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  Esta ação é <strong>irreversível</strong>. Todos os dados da clínica serão excluídos permanentemente, incluindo:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Todos os membros serão desvinculados</li>
                  <li>Convites pendentes serão cancelados</li>
                  <li>Configurações da clínica serão perdidas</li>
                </ul>
                <p className="pt-2">
                  Para confirmar, digite <strong>{organizationName}</strong> abaixo:
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              placeholder="Digite o nome da clínica"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText("")}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!canDelete || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
