import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./_components/dashboard-content";
import { getUserRole } from "@/lib/auth/authorization";

async function getDashboardStats() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalPatients: 0,
      activePlans: 0,
      todayAppointments: 0,
      upcomingAppointments: [],
    };
  }

  const userRole = await getUserRole();
  const isReceptionist = userRole?.role === "receptionist";

  // For receptionists, let RLS handle the filtering (they see all org data)
  // For nutris, filter to their own data
  let patientsQuery = supabase
    .from("patients")
    .select("*", { count: "exact", head: true });

  let activePlansQuery = supabase
    .from("meal_plans")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (!isReceptionist) {
    patientsQuery = patientsQuery.eq("nutri_id", user.id);
    activePlansQuery = activePlansQuery.eq("nutri_id", user.id);
  }

  // Get total patients count
  const { count: totalPatients } = await patientsQuery;

  // Get active meal plans count
  const { count: activePlans } = await activePlansQuery;

  // Get today's appointments
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  let todayAppointmentsQuery = supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_at", startOfDay)
    .lte("scheduled_at", endOfDay);

  if (!isReceptionist) {
    todayAppointmentsQuery = todayAppointmentsQuery.eq("nutri_id", user.id);
  }

  const { count: todayAppointments } = await todayAppointmentsQuery;

  // Get upcoming appointments (next 5)
  let upcomingAppointmentsQuery = supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      patients (
        id,
        full_name
      )
    `)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (!isReceptionist) {
    upcomingAppointmentsQuery = upcomingAppointmentsQuery.eq("nutri_id", user.id);
  }

  const { data: upcomingAppointments } = await upcomingAppointmentsQuery;

  return {
    totalPatients: totalPatients ?? 0,
    activePlans: activePlans ?? 0,
    todayAppointments: todayAppointments ?? 0,
    upcomingAppointments: (upcomingAppointments ?? []).map((apt) => ({
      id: apt.id,
      scheduled_at: apt.scheduled_at,
      duration_minutes: apt.duration_minutes,
      status: apt.status,
      patients: apt.patients as { id: string; full_name: string } | null,
    })),
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return <DashboardContent stats={stats} />;
}
