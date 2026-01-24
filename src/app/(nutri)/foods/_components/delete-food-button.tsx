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

interface DeleteFoodButtonProps {
  foodId: string;
  foodName: string;
}

export function DeleteFoodButton({
  foodId,
  foodName,
}: DeleteFoodButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("food_items")
      .delete()
      .eq("id", foodId);

    if (error) {
      console.error("Error deleting food:", error);
      setIsLoading(false);
      return;
    }

    router.push("/foods");
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
          <DialogTitle>Excluir Alimento</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o alimento{" "}
            <strong>{foodName}</strong>? Esta ação não pode ser desfeita e
            o alimento será removido permanentemente do sistema.
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
            {isLoading ? "Excluindo..." : "Excluir Alimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
