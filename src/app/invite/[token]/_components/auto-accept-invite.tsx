"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { OrgRole } from "@/types/database";
import { getDefaultRedirectPath } from "@/lib/auth/authorization-client";
import { AcceptInviteButton } from "./accept-invite-button";

interface AutoAcceptInviteProps {
  token: string;
  role: OrgRole;
}

export function AutoAcceptInvite({ token, role }: AutoAcceptInviteProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function accept() {
      try {
        const response = await fetch("/api/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (cancelled) return;

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setErrorMessage(data.error || "Erro ao aceitar convite");
          setStatus("failed");
          return;
        }

        setStatus("success");
        toast.success("Convite aceito com sucesso!");

        // Brief delay to show success state before redirect
        setTimeout(() => {
          if (!cancelled) {
            router.push(getDefaultRedirectPath(role, true));
            router.refresh();
          }
        }, 800);
      } catch {
        if (!cancelled) {
          setErrorMessage("Erro ao aceitar convite. Tente novamente.");
          setStatus("failed");
        }
      }
    }

    accept();
    return () => { cancelled = true; };
  }, [token, role, router]);

  if (status === "failed") {
    return (
      <div className="space-y-3">
        {errorMessage && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive text-center">
            {errorMessage}
          </div>
        )}
        <AcceptInviteButton token={token} role={role} />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <p className="text-sm text-muted-foreground">Convite aceito! Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Aceitando convite...</p>
    </div>
  );
}
