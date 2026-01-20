"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface RemoveFoodButtonProps {
  contentId: string;
  removeFoodFromMeal: (contentId: string) => Promise<void>;
}

export function RemoveFoodButton({
  contentId,
  removeFoodFromMeal,
}: RemoveFoodButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      await removeFoodFromMeal(contentId);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleRemove}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
