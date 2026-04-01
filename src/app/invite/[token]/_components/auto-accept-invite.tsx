"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { OrgRole } from "@/types/database";
import { AcceptInviteButton } from "./accept-invite-button";

interface AutoAcceptInviteProps {
  token: string;
  role: OrgRole;
}

function getRedirectPath(role: OrgRole): string {
  switch (role) {
    case "receptionist":
      return "/schedule";
    case "patient":
      return "/patient/dashboard";
    default:
      return "/dashboard";
  }
}

export function AutoAcceptInvite({ token, role }: AutoAcceptInviteProps) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

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
          setFailed(true);
          return;
        }

        router.push(getRedirectPath(role));
        router.refresh();
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    accept();
    return () => { cancelled = true; };
  }, [token, role, router]);

  if (failed) {
    return <AcceptInviteButton token={token} role={role} />;
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Aceitando convite...</p>
    </div>
  );
}
