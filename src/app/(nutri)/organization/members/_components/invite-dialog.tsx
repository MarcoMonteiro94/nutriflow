"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import type { OrgRole } from "@/types/database";
import { getInvitableRoles, roleLabels, canInviteMembers } from "@/lib/auth/authorization-client";

interface InviteDialogProps {
  organizationId: string;
  currentUserRole: OrgRole | null;
  isOwner?: boolean;
}

const roleDescriptions: Record<OrgRole, string> = {
  admin: "Pode gerenciar membros, configurações e todos os recursos da clínica.",
  nutri: "Pode gerenciar pacientes, planos alimentares e consultas.",
  receptionist: "Pode gerenciar agenda e visualizar pacientes.",
  patient: "Acesso ao portal do paciente para ver planos e consultas.",
};

export function InviteDialog({ organizationId, currentUserRole, isOwner }: InviteDialogProps) {
  const router = useRouter();
  // Get the roles this user can invite
  const invitableRoles = getInvitableRoles(currentUserRole, isOwner);

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole | "">(invitableRoles[0] ?? "");

  // Don't render if user can't invite anyone
  if (!canInviteMembers(currentUserRole, isOwner)) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email.trim()) {
      setError("O email é obrigatório");
      setIsLoading(false);
      return;
    }

    if (!role) {
      setError("Selecione uma função");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, email, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erro ao enviar convite");
        setIsLoading(false);
        return;
      }

      setEmail("");
      setRole(invitableRoles[0] || "");
      setOpen(false);
      setIsLoading(false);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>
              Envie um convite para um novo membro se juntar à clínica. O convite expira em 7 dias.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive mt-4">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as OrgRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {invitableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {role && (
                <p className="text-xs text-muted-foreground">
                  {roleDescriptions[role]}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
