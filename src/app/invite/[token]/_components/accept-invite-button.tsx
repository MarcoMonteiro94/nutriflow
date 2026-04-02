"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { OrgRole } from "@/types/database";
import { getDefaultRedirectPath } from "@/lib/auth/authorization-client";

interface AcceptInviteButtonProps {
  token: string;
  role?: OrgRole;
}

export function AcceptInviteButton({ token, role }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao aceitar convite");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Convite aceito com sucesso!");

      // Brief delay to show success state before redirect
      setTimeout(() => {
        const redirectPath = getDefaultRedirectPath(role ?? null, true);
        router.push(redirectPath);
        router.refresh();
      }, 800);
    } catch (err) {
      console.error("Error accepting invite:", err);
      setError("Erro ao aceitar convite. Tente novamente.");
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <p className="text-sm text-muted-foreground">Convite aceito! Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}
      <Button
        onClick={handleAccept}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          "Aceitando..."
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Aceitar Convite
          </>
        )}
      </Button>
    </div>
  );
}
