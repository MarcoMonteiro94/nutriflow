"use client";

import { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { nanoid } from "nanoid";
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
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole | "">("");

  // Get the roles this user can invite
  const invitableRoles = getInvitableRoles(currentUserRole, isOwner);

  // Set default role to first available option
  useEffect(() => {
    if (invitableRoles.length > 0 && !role) {
      setRole(invitableRoles[0]);
    }
  }, [invitableRoles, role]);

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

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado");
      setIsLoading(false);
      return;
    }

    // Check if email is already invited
    const { data: existingInvite } = await supabase
      .from("organization_invites")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .is("accepted_at", null)
      .single();

    if (existingInvite) {
      setError("Este email já possui um convite pendente");
      setIsLoading(false);
      return;
    }

    // Check if user is already a member
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", existingProfile.id)
        .single();

      if (existingMember) {
        setError("Este usuário já é membro da organização");
        setIsLoading(false);
        return;
      }
    }

    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const { error: createError } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (createError) {
      setError(createError.message);
      setIsLoading(false);
      return;
    }

    setEmail("");
    setRole(invitableRoles[0] || "");
    setOpen(false);
    setIsLoading(false);
    router.refresh();
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
