import { createClient } from "@/lib/supabase/server";
import type {
  Appointment,
  AppointmentHistory,
  InsertTables,
  UpdateTables,
} from "@/types/database";

export type InsertAppointment = InsertTables<"appointments">;
export type UpdateAppointment = UpdateTables<"appointments">;

export async function getAppointmentById(
  id: string
): Promise<Appointment | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("nutri_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching appointment:", error);
    return null;
  }

  return data as Appointment | null;
}

export async function getAppointmentHistory(
  appointmentId: string
): Promise<AppointmentHistory[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("appointment_history")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching appointment history:", error);
    return [];
  }

  return (data ?? []) as AppointmentHistory[];
}

export async function rescheduleAppointment(
  appointmentId: string,
  newScheduledAt: Date,
  reason?: string
): Promise<{ data: Appointment | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      scheduled_at: newScheduledAt.toISOString(),
      rescheduled_at: new Date().toISOString(),
      rescheduled_reason: reason || null,
    })
    .eq("id", appointmentId)
    .eq("nutri_id", user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Appointment, error: null };
}

export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
    })
    .eq("id", appointmentId)
    .eq("nutri_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function completeAppointment(
  appointmentId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "completed",
    })
    .eq("id", appointmentId)
    .eq("nutri_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function markNoShow(
  appointmentId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "no_show",
    })
    .eq("id", appointmentId)
    .eq("nutri_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Realizado",
    cancelled: "Cancelado",
    no_show: "Não compareceu",
  };
  return labels[status] || status;
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    created: "Criado",
    rescheduled: "Reagendado",
    cancelled: "Cancelado",
    completed: "Realizado",
    no_show: "Não compareceu",
  };
  return labels[action] || action;
}
