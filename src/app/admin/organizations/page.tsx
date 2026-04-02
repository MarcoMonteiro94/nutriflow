"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Plus,
  Search,
  Users,
  UserCheck,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganizationWithStats } from "@/types/admin";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function OrgCardSkeleton() {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-56" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateOrgForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(generateSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName || !trimmedSlug) {
      setFormError("Nome e slug são obrigatórios");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, slug: trimmedSlug }),
      });

      if (res.status === 409) {
        setFormError("Este slug já está em uso");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setFormError(json?.error ?? "Erro ao criar clínica");
        setSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setFormError("Erro de conexão. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Nome da clínica</Label>
        <Input
          id="org-name"
          data-testid="org-name-input"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: Clínica Nutri Vida"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-slug">Slug</Label>
        <Input
          id="org-slug"
          data-testid="org-slug-input"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="clinica-nutri-vida"
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">
          Identificador único usado na URL
        </p>
      </div>

      {formError && (
        <p
          data-testid="org-form-error"
          className="text-sm text-destructive"
        >
          {formError}
        </p>
      )}

      <Button
        type="submit"
        data-testid="create-org-submit"
        disabled={submitting || !name.trim() || !slug.trim()}
        className="w-full"
      >
        {submitting ? "Criando..." : "Criar Clínica"}
      </Button>
    </form>
  );
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrganizations = useCallback(
    async (searchValue: string, status: string) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (searchValue) params.set("search", searchValue);

      try {
        const res = await fetch(`/api/admin/organizations?${params}`);
        if (!res.ok) {
          setError("Erro ao carregar clínicas");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setOrgs(json.data);
      } catch {
        setError("Erro de conexão. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch and refetch when statusFilter changes
  useEffect(() => {
    fetchOrganizations(search, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Debounced search
  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOrganizations(value, statusFilter);
    }, 300);
  }

  function handleCreateSuccess() {
    fetchOrganizations(search, statusFilter);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clínicas</h1>
          <p className="text-muted-foreground">
            Gerencie as clínicas da plataforma
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-org-button">
              <Plus className="mr-2 h-4 w-4" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="create-org-dialog">
            <DialogHeader>
              <DialogTitle>Criar nova clínica</DialogTitle>
            </DialogHeader>
            <CreateOrgForm
              onSuccess={handleCreateSuccess}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="org-search"
            placeholder="Buscar clínicas..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger
            data-testid="org-status-filter"
            className="w-full sm:w-[160px]"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {error ? (
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchOrganizations(search, statusFilter)}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrgCardSkeleton key={i} />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <Card
          data-testid="org-empty-state"
          className="rounded-2xl shadow-soft"
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma clínica encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div data-testid="org-list" className="space-y-4">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/admin/organizations/${org.id}`}
              className="block"
            >
              <Card
                data-testid="org-card"
                className="rounded-2xl shadow-soft transition-colors hover:bg-muted/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Name + Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-base">{org.name}</h3>
                        <Badge
                          variant="secondary"
                          className={
                            org.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          }
                        >
                          {org.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>

                      {/* Slug */}
                      <p className="text-sm text-muted-foreground font-mono">
                        /{org.slug}
                      </p>

                      {/* Owner */}
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {org.owner.full_name}
                        </span>{" "}
                        &middot; {org.owner.email}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {org.memberCount}{" "}
                          {org.memberCount === 1 ? "membro" : "membros"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5" />
                          {org.patientCount}{" "}
                          {org.patientCount === 1 ? "paciente" : "pacientes"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(org.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
