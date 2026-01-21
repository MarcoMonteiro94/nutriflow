import { createClient } from "@/lib/supabase/server";
import type {
  NutriAvailability,
  InsertTables,
  UpdateTables,
} from "@/types/database";

export type AvailabilitySlot = NutriAvailability;
export type InsertAvailability = InsertTables<"nutri_availability">;
export type UpdateAvailability = UpdateTables<"nutri_availability">;

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function getDayName(dayOfWeek: number): string {
  return DAYS_OF_WEEK[dayOfWeek] ?? "Dia inválido";
}

export async function getAvailability(): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("nutri_availability")
    .select("*")
    .eq("nutri_id", user.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching availability:", error);
    return [];
  }

  return (data ?? []) as AvailabilitySlot[];
}

export async function getAvailabilityByDay(
  dayOfWeek: number
): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("nutri_availability")
    .select("*")
    .eq("nutri_id", user.id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching availability by day:", error);
    return [];
  }

  return (data ?? []) as AvailabilitySlot[];
}

export async function createAvailabilitySlot(
  slot: Omit<InsertAvailability, "nutri_id">
): Promise<{ data: AvailabilitySlot | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  const { data, error } = await supabase
    .from("nutri_availability")
    .insert({ ...slot, nutri_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "Já existe um horário neste dia e hora" };
    }
    return { data: null, error: error.message };
  }

  return { data: data as AvailabilitySlot, error: null };
}

export async function updateAvailabilitySlot(
  id: string,
  updates: UpdateAvailability
): Promise<{ data: AvailabilitySlot | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  const { data, error } = await supabase
    .from("nutri_availability")
    .update(updates)
    .eq("id", id)
    .eq("nutri_id", user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as AvailabilitySlot, error: null };
}

export async function deleteAvailabilitySlot(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  const { error } = await supabase
    .from("nutri_availability")
    .delete()
    .eq("id", id)
    .eq("nutri_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function toggleAvailabilitySlot(
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  const { error } = await supabase
    .from("nutri_availability")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("nutri_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function bulkCreateAvailability(
  slots: Omit<InsertAvailability, "nutri_id">[]
): Promise<{ data: AvailabilitySlot[] | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  const slotsWithNutriId = slots.map((slot) => ({
    ...slot,
    nutri_id: user.id,
  }));

  const { data, error } = await supabase
    .from("nutri_availability")
    .insert(slotsWithNutriId)
    .select();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as AvailabilitySlot[], error: null };
}

export async function clearDayAvailability(
  dayOfWeek: number
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  const { error } = await supabase
    .from("nutri_availability")
    .delete()
    .eq("nutri_id", user.id)
    .eq("day_of_week", dayOfWeek);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
