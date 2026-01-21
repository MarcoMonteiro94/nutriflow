import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PatientsList } from "./_components/patients-list";
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

  let query = supabase
    .from("patients")
    .select("*")
    .eq("nutri_id", user.id)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus pacientes e prontuários.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <form className="flex-1" action="/patients" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar por nome ou email..."
              defaultValue={params.q}
              className="pl-10"
            />
          </div>
        </form>
      </div>

      <PatientsList patients={patients} searchQuery={params.q} />
    </div>
  );
}
