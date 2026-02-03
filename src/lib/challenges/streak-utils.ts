import { createClient } from "@/lib/supabase/client";
import { isSameDay, subDays, parseISO, startOfDay } from "date-fns";
import type { AchievementType } from "@/types/database";

/**
 * Calculate the current streak for a participant's goal
 * Streak is broken if any day is missed (strict mode)
 */
export async function calculateStreak(
  participantId: string,
  goalId: string
): Promise<{ current: number; best: number }> {
  const supabase = createClient();

  // Get all checkins for this goal, ordered by date descending
  const { data: checkins } = await (supabase as any)
    .from("goal_checkins")
    .select("checkin_date")
    .eq("participant_id", participantId)
    .eq("goal_id", goalId)
    .eq("completed", true)
    .order("checkin_date", { ascending: false });

  if (!checkins || checkins.length === 0) {
    return { current: 0, best: 0 };
  }

  // Calculate current streak (consecutive days ending today or yesterday)
  let currentStreak = 0;
  const today = startOfDay(new Date());
  let expectedDate = today;

  // Check if last checkin was today or yesterday
  const lastCheckinDate = startOfDay(parseISO(checkins[0].checkin_date));
  const daysSinceLastCheckin = Math.floor(
    (today.getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If last checkin was more than 1 day ago, streak is broken
  if (daysSinceLastCheckin > 1) {
    return { current: 0, best: calculateBestStreak(checkins) };
  }

  // Start from yesterday if no checkin today
  if (daysSinceLastCheckin === 1) {
    expectedDate = subDays(today, 1);
  }

  // Count consecutive days
  for (const checkin of checkins) {
    const checkinDate = startOfDay(parseISO(checkin.checkin_date));

    if (isSameDay(checkinDate, expectedDate)) {
      currentStreak++;
      expectedDate = subDays(expectedDate, 1);
    } else if (checkinDate < expectedDate) {
      // Gap found, streak broken
      break;
    }
  }

  return {
    current: currentStreak,
    best: Math.max(currentStreak, calculateBestStreak(checkins)),
  };
}

/**
 * Calculate the best streak ever achieved
 */
function calculateBestStreak(checkins: { checkin_date: string }[]): number {
  if (checkins.length === 0) return 0;

  // Sort by date ascending for easier calculation
  const sortedCheckins = [...checkins].sort(
    (a, b) =>
      parseISO(a.checkin_date).getTime() - parseISO(b.checkin_date).getTime()
  );

  let bestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedCheckins.length; i++) {
    const prevDate = startOfDay(parseISO(sortedCheckins[i - 1].checkin_date));
    const currDate = startOfDay(parseISO(sortedCheckins[i].checkin_date));
    const diffDays = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
    // if diffDays === 0, same day checkin, ignore
  }

  return bestStreak;
}

/**
 * Update streak count after a check-in
 */
export async function updateStreakAfterCheckin(
  participantId: string,
  goalId: string
): Promise<{ current: number; best: number }> {
  const supabase = createClient();

  // Calculate new streak
  const { current, best } = await calculateStreak(participantId, goalId);

  // Get current best streak from participant
  const { data: participant } = await supabase
    .from("challenge_participants")
    .select("best_streak")
    .eq("id", participantId)
    .single();

  const newBestStreak = Math.max(best, participant?.best_streak ?? 0);

  // Update participant streak counts
  await supabase
    .from("challenge_participants")
    .update({
      streak_count: current,
      best_streak: newBestStreak,
    })
    .eq("id", participantId);

  return { current, best: newBestStreak };
}

/**
 * Check and create streak achievements if earned
 */
export async function checkStreakAchievements(
  participantId: string,
  goalId: string,
  currentStreak: number
): Promise<AchievementType[]> {
  const supabase = createClient();
  const earnedAchievements: AchievementType[] = [];

  const thresholds: { days: number; type: AchievementType }[] = [
    { days: 7, type: "streak_7" },
    { days: 14, type: "streak_14" },
    { days: 21, type: "streak_21" },
  ];

  for (const { days, type } of thresholds) {
    if (currentStreak >= days) {
      // Check if achievement already exists
      const { data: existing } = await (supabase as any)
        .from("participant_achievements")
        .select("id")
        .eq("participant_id", participantId)
        .eq("goal_id", goalId)
        .eq("achievement_type", type)
        .single();

      if (!existing) {
        // Create new achievement
        await (supabase as any).from("participant_achievements").insert({
          participant_id: participantId,
          goal_id: goalId,
          achievement_type: type,
          earned_at: new Date().toISOString(),
        });
        earnedAchievements.push(type);
      }
    }
  }

  return earnedAchievements;
}

/**
 * Check if patient has done a check-in for the goal today
 */
export async function hasCheckinToday(
  participantId: string,
  goalId: string
): Promise<boolean> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await (supabase as any)
    .from("goal_checkins")
    .select("id")
    .eq("participant_id", participantId)
    .eq("goal_id", goalId)
    .eq("checkin_date", today)
    .single();

  return !!data;
}

/**
 * Get all check-ins for a goal
 */
export async function getGoalCheckins(
  participantId: string,
  goalId: string
): Promise<{ checkin_date: string; completed: boolean; image_url: string | null; metric_value: number | null }[]> {
  const supabase = createClient();

  const { data } = await (supabase as any)
    .from("goal_checkins")
    .select("checkin_date, completed, image_url, metric_value")
    .eq("participant_id", participantId)
    .eq("goal_id", goalId)
    .order("checkin_date", { ascending: false });

  return data ?? [];
}
