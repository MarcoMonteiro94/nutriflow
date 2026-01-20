import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PatientCard } from "./_components/patient-card";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus pacientes e prontuários.
          </p>
        </div>
        <Button asChild>
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

      {/* Patient List */}
      {patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              {params.q ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {params.q
                ? `Não encontramos pacientes com "${params.q}". Tente outro termo.`
                : "Comece cadastrando seu primeiro paciente para gerenciar seus atendimentos."}
            </p>
            {!params.q && (
              <Button asChild className="mt-4">
                <Link href="/patients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Paciente
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}
