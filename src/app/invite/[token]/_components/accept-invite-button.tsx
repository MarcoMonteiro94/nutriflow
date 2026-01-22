"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface AcceptInviteButtonProps {
  token: string;
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Error accepting invite:", err);
      setError("Erro ao aceitar convite");
      setIsLoading(false);
    }
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
