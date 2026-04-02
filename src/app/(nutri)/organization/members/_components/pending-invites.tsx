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
import { Mail, Trash2, Clock, Copy, Check, MessageCircle, RefreshCw } from "lucide-react";
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

function getExpirationInfo(expiresAt: string): {
  text: string;
  isExpired: boolean;
  status: "pending" | "expired";
} {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: "Expirado", isExpired: true, status: "expired" };
  }
  if (diffDays === 0) {
    return { text: "Expira hoje", isExpired: false, status: "pending" };
  }
  if (diffDays === 1) {
    return { text: "Expira amanhã", isExpired: false, status: "pending" };
  }
  return { text: `Expira em ${diffDays} dias`, isExpired: false, status: "pending" };
}

export function PendingInvites({ invites }: PendingInvitesProps) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

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

  async function handleCancel(inviteId: string) {
    setCancellingId(inviteId);
    try {
      const res = await fetch("/api/organization/invite/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      if (!res.ok) {
        console.error("Failed to cancel invite");
      }
    } catch {
      console.error("Error cancelling invite");
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
      router.refresh();
    }
  }

  async function handleResend(inviteId: string) {
    setResendingId(inviteId);
    try {
      const res = await fetch("/api/organization/invite/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      if (!res.ok) {
        console.error("Failed to resend invite");
      }
    } catch {
      console.error("Error resending invite");
    } finally {
      setResendingId(null);
      router.refresh();
    }
  }

  // Separate pending and expired invites
  const pendingInvites = invites.filter(
    (inv) => getExpirationInfo(inv.expires_at).status === "pending"
  );
  const expiredInvites = invites.filter(
    (inv) => getExpirationInfo(inv.expires_at).status === "expired"
  );

  return (
    <>
      <Card data-testid="pending-invites-card">
        <CardHeader>
          <CardTitle className="text-lg">Convites Pendentes</CardTitle>
          <CardDescription>
            Convites aguardando aceitação dos destinatários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvites.length === 0 && expiredInvites.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum convite pendente.
            </p>
          )}

          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                  copiedId={copiedId}
                  cancellingId={cancellingId}
                  resendingId={resendingId}
                  onCopy={handleCopy}
                  onWhatsApp={handleWhatsApp}
                  onCancel={(id) => setConfirmCancelId(id)}
                  onResend={handleResend}
                />
              ))}
            </div>
          )}

          {expiredInvites.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Expirados ({expiredInvites.length})
              </h4>
              {expiredInvites.map((invite) => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                  copiedId={copiedId}
                  cancellingId={cancellingId}
                  resendingId={resendingId}
                  onCopy={handleCopy}
                  onWhatsApp={handleWhatsApp}
                  onCancel={(id) => setConfirmCancelId(id)}
                  onResend={handleResend}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel confirmation dialog */}
      <AlertDialog
        open={!!confirmCancelId}
        onOpenChange={(open) => !open && setConfirmCancelId(null)}
      >
        <AlertDialogContent data-testid="cancel-invite-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este convite? O destinatário não
              poderá mais aceitar o convite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!cancellingId}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="cancel-invite-confirm"
              disabled={!!cancellingId}
              onClick={() => confirmCancelId && handleCancel(confirmCancelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancellingId ? "Cancelando..." : "Cancelar Convite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InviteRow({
  invite,
  copiedId,
  cancellingId,
  resendingId,
  onCopy,
  onWhatsApp,
  onCancel,
  onResend,
}: {
  invite: OrganizationInvite;
  copiedId: string | null;
  cancellingId: string | null;
  resendingId: string | null;
  onCopy: (invite: OrganizationInvite) => void;
  onWhatsApp: (invite: OrganizationInvite) => void;
  onCancel: (id: string) => void;
  onResend: (id: string) => void;
}) {
  const { text: expirationText, isExpired, status } = getExpirationInfo(
    invite.expires_at
  );

  return (
    <div
      data-testid="invite-row"
      className={`flex items-center justify-between rounded-lg border p-3 ${
        isExpired ? "opacity-60" : ""
      }`}
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
        <Badge
          data-testid="invite-status-badge"
          variant="secondary"
          className={
            status === "expired"
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
          }
        >
          {status === "expired" ? "Expirado" : "Pendente"}
        </Badge>

        {/* Resend button (especially useful for expired invites) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="resend-invite"
                onClick={() => onResend(invite.id)}
                disabled={resendingId === invite.id}
                className="h-8 w-8"
              >
                <RefreshCw
                  className={`h-4 w-4 text-muted-foreground ${
                    resendingId === invite.id ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reenviar convite (novo token)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!isExpired && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCopy(invite)}
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
                    onClick={() => onWhatsApp(invite)}
                    className="h-8 w-8"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enviar via WhatsApp</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="cancel-invite"
                onClick={() => onCancel(invite.id)}
                disabled={cancellingId === invite.id}
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
}
