import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./_components/dashboard-content";

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

  // Get total patients count
  const { count: totalPatients } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("nutri_id", user.id);

  // Get active meal plans count
  const { count: activePlans } = await supabase
    .from("meal_plans")
    .select("*", { count: "exact", head: true })
    .eq("nutri_id", user.id)
    .eq("status", "active");

  // Get today's appointments
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { count: todayAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("nutri_id", user.id)
    .gte("scheduled_at", startOfDay)
    .lte("scheduled_at", endOfDay);

  // Get upcoming appointments (next 5)
  const { data: upcomingAppointments } = await supabase
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
    .eq("nutri_id", user.id)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5);

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
