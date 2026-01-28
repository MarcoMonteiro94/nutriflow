import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PatientsSearch } from "./_components/patients-search";
import { PatientsGrid } from "./_components/patients-grid";
import { PatientsSidebar } from "./_components/patients-sidebar";
import { getUserRole } from "@/lib/auth/authorization";
import type { Patient } from "@/types/database";

interface SearchParams {
  q?: string;
}

async function getPatients(searchQuery?: string): Promise<Patient[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const userRole = await getUserRole();
  const isReceptionist = userRole?.role === "receptionist";

  // For receptionists, let RLS handle the filtering (they see all org patients)
  // For nutris, filter to their own patients
  let query = supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isReceptionist) {
    query = query.eq("nutri_id", user.id);
  }

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
  }

  const { data } = await query;

  return (data ?? []) as Patient[];
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const patients = await getPatients(params.q);

  // Get user role
  const userRole = await getUserRole();
  const isReceptionist = userRole?.role === "receptionist";

  // Calculate stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = patients.filter(p => new Date(p.created_at) > weekAgo).length;
  const withGoals = patients.filter(p => p.goal).length;

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
        <PatientsSearch defaultValue={params.q} totalCount={patients.length} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Patients Grid */}
        <div className="order-2 lg:order-1">
          <PatientsGrid patients={patients} searchQuery={params.q} isReceptionist={isReceptionist} />
        </div>

        {/* Desktop Sidebar */}
        <div className="order-1 lg:order-2">
          <PatientsSidebar
            patients={patients}
            totalCount={patients.length}
            newThisWeek={newThisWeek}
            withGoals={withGoals}
            isReceptionist={isReceptionist}
          />
        </div>
      </div>
    </div>
  );
}
