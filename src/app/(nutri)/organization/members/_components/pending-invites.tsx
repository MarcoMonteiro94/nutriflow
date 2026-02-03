"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mail, Trash2, Clock, Copy, Check, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OrganizationInvite, OrgRole } from "@/types/database";

interface PendingInvitesProps {
  invites: OrganizationInvite[];
}

const roleLabels: Record<OrgRole, string> = {
  admin: "Administrador",
  nutri: "Nutricionista",
  receptionist: "Recepcionista",
  patient: "Paciente",
};

function getExpirationText(expiresAt: string): { text: string; isExpired: boolean } {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: "Expirado", isExpired: true };
  }
  if (diffDays === 0) {
    return { text: "Expira hoje", isExpired: false };
  }
  if (diffDays === 1) {
    return { text: "Expira amanhã", isExpired: false };
  }
  return { text: `Expira em ${diffDays} dias`, isExpired: false };
}

export function PendingInvites({ invites }: PendingInvitesProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (invites.length === 0) {
    return null;
  }

  function getInviteLink(token: string): string {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/invite/${token}`;
  }

  async function handleCopy(invite: OrganizationInvite) {
    const link = getInviteLink(invite.token);
    await navigator.clipboard.writeText(link);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleWhatsApp(invite: OrganizationInvite) {
    const link = getInviteLink(invite.token);
    const role = roleLabels[invite.role as OrgRole];
    const message = encodeURIComponent(
      `Olá! Você foi convidado para se juntar à nossa clínica no NutriFlow como ${role}.\n\nClique no link abaixo para aceitar o convite:\n${link}\n\nO convite expira em 7 dias.`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  async function handleDelete(inviteId: string) {
    setDeletingId(inviteId);
    const supabase = createClient();
    await supabase
      .from("organization_invites")
      .delete()
      .eq("id", inviteId);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Convites Pendentes</CardTitle>
        <CardDescription>
          Convites aguardando aceitação dos destinatários.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invites.map((invite) => {
            const { text: expirationText, isExpired } = getExpirationText(invite.expires_at);

            return (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className={isExpired ? "text-destructive" : ""}>
                        {expirationText}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{roleLabels[invite.role as OrgRole]}</Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(invite)}
                          className="h-8 w-8"
                        >
                          {copiedId === invite.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copiedId === invite.id ? "Copiado!" : "Copiar link"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWhatsApp(invite)}
                          className="h-8 w-8"
                        >
                          <MessageCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Enviar via WhatsApp</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invite.id)}
                          disabled={deletingId === invite.id}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cancelar convite</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
