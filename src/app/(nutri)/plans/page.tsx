import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { PlansList } from "./_components/plans-list";
import { getUserRole, isClinicalRole } from "@/lib/auth/authorization";
import type { MealPlan } from "@/types/database";

type MealPlanWithPatient = MealPlan & {
  patients: {
    id: string;
    full_name: string;
  } | null;
};

interface SearchParams {
  patient?: string;
}

async function getMealPlans(patientId?: string): Promise<MealPlanWithPatient[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("meal_plans")
    .select(`
      *,
      patients (
        id,
        full_name
      )
    `)
    .eq("nutri_id", user.id);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data } = await query.order("updated_at", { ascending: false });

  return (data ?? []) as MealPlanWithPatient[];
}

async function getPatientName(patientId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("full_name")
    .eq("id", patientId)
    .single();
  return data?.full_name ?? null;
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Block non-clinical roles (receptionists) from accessing this page
  const userRole = await getUserRole();
  if (!userRole || !isClinicalRole(userRole.role)) {
    redirect("/schedule");
  }

  const params = await searchParams;
  const patientId = params.patient;
  const mealPlans = await getMealPlans(patientId);
  const patientName = patientId ? await getPatientName(patientId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planos Alimentares</h1>
          <p className="text-muted-foreground">
            {patientName
              ? `Planos de ${patientName}`
              : "Gerencie os planos alimentares dos seus pacientes."}
          </p>
        </div>
        <div className="flex gap-2">
          {patientId && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/plans">
                <X className="mr-2 h-4 w-4" />
                Limpar Filtro
              </Link>
            </Button>
          )}
          <Button asChild className="w-full sm:w-auto">
            <Link href={patientId ? `/plans/new?patient=${patientId}` : "/plans/new"}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Link>
          </Button>
        </div>
      </div>

      <PlansList mealPlans={mealPlans} />
    </div>
  );
}
