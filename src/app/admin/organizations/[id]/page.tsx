"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  Mail,
  Copy,
  Check,
  UserPlus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  owner: { full_name: string; email: string };
  memberCount: number;
  patientCount: number;
  created_at: string;
}

interface Member {
  id: string;
  role: string;
  status: string;
  accepted_at: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roleBadge(role: string) {
  switch (role) {
    case "admin":
      return <Badge variant="default">{role}</Badge>;
    case "nutri":
      return <Badge variant="secondary">{role}</Badge>;
    case "receptionist":
      return <Badge variant="outline">{role}</Badge>;
    case "patient":
      return <Badge variant="outline">{role}</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Ativo
        </Badge>
      );
    case "pending":
      return (
        <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Pendente
        </Badge>
      );
    case "inactive":
      return (
        <Badge className="border-transparent bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
          Inativo
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function orgStatusBadge(isActive: boolean) {
  return isActive ? (
    <Badge
      data-testid="org-detail-status"
      className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    >
      Ativa
    </Badge>
  ) : (
    <Badge
      data-testid="org-detail-status"
      className="border-transparent bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
    >
      Inativa
    </Badge>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/organizations/${id}/members`);
    if (!res.ok) throw new Error("Erro ao buscar membros");
    const json = await res.json();
    setMembers(json.data ?? []);
  }, [id]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [orgRes, membersRes] = await Promise.all([
          fetch("/api/admin/organizations"),
          fetch(`/api/admin/organizations/${id}/members`),
        ]);

        if (!orgRes.ok) throw new Error("Erro ao buscar organização");
        if (!membersRes.ok) throw new Error("Erro ao buscar membros");

        const orgData = await orgRes.json();
        const membersData = await membersRes.json();

        const found = (orgData.data as Organization[]).find(
          (o) => o.id === id
        );
        if (!found) {
          setError("Organização não encontrada");
          return;
        }

        setOrg(found);
        setMembers(membersData.data ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/admin/organizations/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: "admin" }),
      });

      const json = await res.json();

      if (!res.ok) {
        setInviteError(json.error ?? "Erro ao enviar convite");
        return;
      }

      setInviteUrl(json.data.inviteUrl);
      await fetchMembers();
    } catch {
      setInviteError("Erro ao enviar convite");
    } finally {
      setInviteLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function resetDialog() {
    setInviteEmail("");
    setInviteError(null);
    setInviteUrl(null);
    setCopied(false);
  }

  // ---- Loading state ----
  if (loading) {
    return <DetailSkeleton />;
  }

  // ---- Error state ----
  if (error || !org) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para clínicas
        </Link>
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {error ?? "Organização não encontrada"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Main content ----
  return (
    <div className="space-y-6" data-testid="org-detail">
      {/* Back link + title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/organizations"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl font-bold tracking-tight"
                data-testid="org-detail-name"
              >
                {org.name}
              </h1>
              {orgStatusBadge(org.is_active)}
            </div>
            <p className="text-sm text-muted-foreground">{org.slug}</p>
          </div>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="invite-admin-button" className="rounded-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Admin</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo administrador de {org.name}.
              </DialogDescription>
            </DialogHeader>

            {inviteUrl ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Convite criado com sucesso. Compartilhe o link abaixo:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inviteUrl}
                    data-testid="invite-url"
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    data-testid="copy-invite-url"
                    onClick={() => copyToClipboard(inviteUrl)}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="sr-only">Copiar link</span>
                  </Button>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetDialog();
                    }}
                    className="rounded-full"
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="admin@clinica.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    data-testid="invite-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input readOnly value="admin" className="bg-muted" />
                </div>
                {inviteError && (
                  <p className="text-sm text-destructive">{inviteError}</p>
                )}
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail}
                    data-testid="invite-submit"
                    className="rounded-full"
                  >
                    {inviteLoading ? "Enviando..." : "Enviar Convite"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Org info card */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Informações da Clínica</CardTitle>
          </div>
          <CardDescription>
            Detalhes gerais e estatísticas da organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Proprietário</dt>
              <dd className="mt-1 text-sm font-medium">
                {org.owner.full_name}
              </dd>
              <dd className="text-xs text-muted-foreground">
                {org.owner.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Criada em</dt>
              <dd className="mt-1 text-sm font-medium">
                {formatDate(org.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Membros</dt>
              <dd className="mt-1 text-sm font-medium">{org.memberCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Pacientes</dt>
              <dd className="mt-1 text-sm font-medium">{org.patientCount}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Members card */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Membros</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              {members.length}{" "}
              {members.length === 1 ? "membro" : "membros"}
            </span>
          </div>
        </CardHeader>
        <CardContent data-testid="member-list">
          {members.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="members-empty"
            >
              <Mail className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Nenhum membro encontrado nesta organização.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  data-testid="member-card"
                  className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-sm">
                      {member.user
                        ? getInitials(member.user.full_name)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user?.full_name ?? "Usuário desconhecido"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user?.email ?? "---"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {roleBadge(member.role)}
                    {statusBadge(member.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
