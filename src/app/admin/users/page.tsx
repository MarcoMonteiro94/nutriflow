"use client";

import { useEffect, useState } from "react";
import { Users, Search, Shield, Building2, Calendar } from "lucide-react";

import type { UserWithMembership, OrganizationWithStats } from "@/types/admin";
import type { OrgRole } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_LABELS: Record<OrgRole, string> = {
  admin: "Admin",
  nutri: "Nutricionista",
  receptionist: "Recepcionista",
  patient: "Paciente",
};

const ROLE_BADGE_VARIANT: Record<OrgRole, "default" | "secondary" | "outline"> =
  {
    admin: "default",
    nutri: "secondary",
    receptionist: "outline",
    patient: "outline",
  };

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function UserCardSkeleton() {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithMembership[]>([]);
  const [organizations, setOrganizations] = useState<
    OrganizationWithStats[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");

  const debouncedSearch = useDebounce(search, 300);

  // Fetch organizations for the filter dropdown (once on mount)
  useEffect(() => {
    fetch("/api/admin/organizations")
      .then((r) => r.json())
      .then((d) => setOrganizations(d.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch users whenever filters change
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (orgFilter !== "all") params.set("orgId", orgFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      try {
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) {
          setError("Erro ao carregar usuários");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setUsers(json.data ?? []);
      } catch {
        setError("Erro ao carregar usuários");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [roleFilter, orgFilter, debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os usuários da plataforma
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="user-search"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger
            data-testid="user-role-filter"
            className="w-full sm:w-[180px]"
          >
            <SelectValue placeholder="Papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="nutri">Nutricionista</SelectItem>
            <SelectItem value="receptionist">Recepcionista</SelectItem>
            <SelectItem value="patient">Paciente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger
            data-testid="user-org-filter"
            className="w-full sm:w-[200px]"
          >
            <SelectValue placeholder="Clínica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      {!loading && !error && (
        <p data-testid="user-count" className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? "usuário" : "usuários"}{" "}
          encontrado{users.length === 1 ? "" : "s"}
        </p>
      )}

      {/* Error state */}
      {error && (
        <Card
          data-testid="user-error"
          className="rounded-2xl border-destructive/50 shadow-soft"
        >
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">
              Tente novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && users.length === 0 && (
        <Card
          data-testid="user-empty-state"
          className="rounded-2xl shadow-soft"
        >
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum usuário encontrado</p>
            <p className="text-xs text-muted-foreground">
              Ajuste os filtros para encontrar usuários.
            </p>
          </CardContent>
        </Card>
      )}

      {/* User list */}
      {!loading && !error && users.length > 0 && (
        <div data-testid="user-list" className="space-y-3">
          {users.map((user) => (
            <Card
              key={user.id}
              data-testid="user-card"
              className="rounded-2xl bg-card shadow-soft transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {user.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.full_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Badges and metadata */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Role badge */}
                    <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </Badge>

                    {/* Organization */}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {user.organization?.name ?? "Sem clínica"}
                    </span>

                    {/* Status badge */}
                    {user.is_active ? (
                      <Badge
                        variant="secondary"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                      >
                        Ativo
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400"
                      >
                        Inativo
                      </Badge>
                    )}

                    {/* Super admin badge */}
                    {user.is_super_admin && (
                      <Badge
                        variant="default"
                        className="gap-1"
                      >
                        <Shield className="h-3 w-3" />
                        Super Admin
                      </Badge>
                    )}

                    {/* Created date */}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
