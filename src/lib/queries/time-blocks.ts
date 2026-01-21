import { createClient } from "@/lib/supabase/server";
import type {
  NutriTimeBlock,
  InsertTables,
  UpdateTables,
  BlockType,
} from "@/types/database";

export type TimeBlock = NutriTimeBlock;
export type InsertTimeBlock = InsertTables<"nutri_time_blocks">;
export type UpdateTimeBlock = UpdateTables<"nutri_time_blocks">;

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  personal: "Pessoal",
  holiday: "Feriado",
  vacation: "Férias",
  other: "Outro",
};

export function getBlockTypeLabel(blockType: BlockType): string {
  return BLOCK_TYPE_LABELS[blockType];
}

export async function getTimeBlocks(): Promise<TimeBlock[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("nutri_time_blocks")
    .select("*")
    .eq("nutri_id", user.id)
    .order("start_datetime", { ascending: true });

  if (error) {
    console.error("Error fetching time blocks:", error);
    return [];
  }

  return (data ?? []) as TimeBlock[];
}

export async function getUpcomingTimeBlocks(
  daysAhead = 30
): Promise<TimeBlock[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const now = new Date().toISOString();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from("nutri_time_blocks")
    .select("*")
    .eq("nutri_id", user.id)
    .gte("end_datetime", now)
    .lte("start_datetime", futureDate.toISOString())
    .order("start_datetime", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming time blocks:", error);
    return [];
  }

  return (data ?? []) as TimeBlock[];
}

export async function getTimeBlocksInRange(
  startDate: Date,
  endDate: Date
): Promise<TimeBlock[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("nutri_time_blocks")
    .select("*")
    .eq("nutri_id", user.id)
    .or(
      `and(start_datetime.lte.${endDate.toISOString()},end_datetime.gte.${startDate.toISOString()})`
    )
    .order("start_datetime", { ascending: true });

  if (error) {
    console.error("Error fetching time blocks in range:", error);
    return [];
  }

  return (data ?? []) as TimeBlock[];
}

export async function createTimeBlock(
  block: Omit<InsertTimeBlock, "nutri_id">
): Promise<{ data: TimeBlock | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  const { data, error } = await supabase
    .from("nutri_time_blocks")
    .insert({ ...block, nutri_id: user.id })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as TimeBlock, error: null };
}

export async function updateTimeBlock(
  id: string,
  updates: UpdateTimeBlock
): Promise<{ data: TimeBlock | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Usuário não autenticado" };
  }

  const { data, error } = await supabase
    .from("nutri_time_blocks")
    .update(updates)
    .eq("id", id)
    .eq("nutri_id", user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as TimeBlock, error: null };
}

export async function deleteTimeBlock(
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
    .from("nutri_time_blocks")
    .delete()
    .eq("id", id)
    .eq("nutri_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export function isTimeBlockActive(block: TimeBlock): boolean {
  const now = new Date();
  const start = new Date(block.start_datetime);
  const end = new Date(block.end_datetime);
  return now >= start && now <= end;
}

export function isTimeBlockUpcoming(block: TimeBlock): boolean {
  const now = new Date();
  const start = new Date(block.start_datetime);
  return start > now;
}

export function formatTimeBlockDuration(block: TimeBlock): string {
  const start = new Date(block.start_datetime);
  const end = new Date(block.end_datetime);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "1 dia";
  }
  return `${diffDays} dias`;
}
