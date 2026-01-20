"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DeletePatientButtonProps {
  patientId: string;
  patientName: string;
}

export function DeletePatientButton({
  patientId,
  patientName,
}: DeletePatientButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", patientId);

    if (error) {
      console.error("Error deleting patient:", error);
      setIsLoading(false);
      return;
    }

    router.push("/patients");
    router.refresh();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Paciente</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o paciente{" "}
            <strong>{patientName}</strong>? Esta ação não pode ser desfeita e
            todos os dados relacionados (planos, consultas, medidas) serão
            excluídos permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Excluindo..." : "Excluir Paciente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
