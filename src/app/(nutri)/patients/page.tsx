import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PatientsSearch } from "./_components/patients-search";
import { PatientsGrid } from "./_components/patients-grid";
import { PatientsSidebar } from "./_components/patients-sidebar";
import { getUserRole } from "@/lib/auth/authorization";
import type { Patient } from "@/types/database";

const PAGE_SIZE = 50;

interface SearchParams {
  q?: string;
  page?: string;
}

async function getPatients(searchQuery?: string, page = 1): Promise<{ patients: Patient[]; totalCount: number }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { patients: [], totalCount: 0 };
  }

  const userRole = await getUserRole();
  const isReceptionist = userRole?.role === "receptionist";

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (!isReceptionist) {
    query = query.eq("nutri_id", user.id);
  }

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
  }

  const { data, count } = await query;

  return { patients: (data ?? []) as Patient[], totalCount: count ?? 0 };
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { patients, totalCount } = await getPatients(params.q, currentPage);

  // Get user role
  const userRole = await getUserRole();
  const isReceptionist = userRole?.role === "receptionist";

  // Calculate stats via count queries
  const supabaseForStats = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let newThisWeekQuery = supabaseForStats
    .from("patients")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo);

  let withGoalsQuery = supabaseForStats
    .from("patients")
    .select("*", { count: "exact", head: true })
    .not("goal", "is", null)
    .neq("goal", "");

  if (!isReceptionist) {
    const { data: { user } } = await supabaseForStats.auth.getUser();
    if (user) {
      newThisWeekQuery = newThisWeekQuery.eq("nutri_id", user.id);
      withGoalsQuery = withGoalsQuery.eq("nutri_id", user.id);
    }
  }

  const [{ count: newThisWeekCount }, { count: withGoalsCount }] = await Promise.all([
    newThisWeekQuery,
    withGoalsQuery,
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus pacientes e acompanhe seu progresso.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto rounded-full" size="lg">
          <Link href="/patients/new">
            <Plus className="mr-2 h-5 w-5" />
            <span className="sm:hidden">Novo Paciente</span>
            <span className="hidden sm:inline">Cadastrar Paciente</span>
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <PatientsSearch defaultValue={params.q} totalCount={totalCount} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Patients Grid */}
        <div className="order-2 lg:order-1 space-y-4">
          <PatientsGrid patients={patients} searchQuery={params.q} isReceptionist={isReceptionist} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {currentPage > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/patients?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), page: (currentPage - 1).toString() }).toString()}`}>
                    Anterior
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              {currentPage < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/patients?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), page: (currentPage + 1).toString() }).toString()}`}>
                    Próxima
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="order-1 lg:order-2">
          <PatientsSidebar
            patients={patients}
            totalCount={totalCount}
            newThisWeek={newThisWeekCount ?? 0}
            withGoals={withGoalsCount ?? 0}
            isReceptionist={isReceptionist}
          />
        </div>
      </div>
    </div>
  );
}
