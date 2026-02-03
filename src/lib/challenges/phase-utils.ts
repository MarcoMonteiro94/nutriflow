import { createClient } from "@/lib/supabase/client";
import type { ChallengePhase, ChallengeGoal } from "@/types/database";

/**
 * Check if a goal is completed (all required check-ins done)
 */
export async function checkGoalCompletion(
  participantId: string,
  goalId: string
): Promise<{ completed: boolean; progress: number; total: number }> {
  const supabase = createClient();

  // Get the goal details
  const { data: goal } = await (supabase as any)
    .from("challenge_goals")
    .select("duration_days")
    .eq("id", goalId)
    .single();

  if (!goal) {
    return { completed: false, progress: 0, total: 0 };
  }

  // Count completed check-ins
  const { count } = await (supabase as any)
    .from("goal_checkins")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participantId)
    .eq("goal_id", goalId)
    .eq("completed", true);

  const progress = count ?? 0;
  const total = goal.duration_days;

  return {
    completed: progress >= total,
    progress,
    total,
  };
}

/**
 * Check if a phase is completed based on its threshold
 */
export async function checkPhaseCompletion(
  participantId: string,
  phaseId: string
): Promise<{ completed: boolean; completionRate: number; threshold: number }> {
  const supabase = createClient();

  // Get phase details
  const { data: phase } = await (supabase as any)
    .from("challenge_phases")
    .select("completion_threshold")
    .eq("id", phaseId)
    .single();

  if (!phase) {
    return { completed: false, completionRate: 0, threshold: 100 };
  }

  // Get all goals in this phase
  const { data: goals } = await (supabase as any)
    .from("challenge_goals")
    .select("id, duration_days")
    .eq("phase_id", phaseId);

  if (!goals || goals.length === 0) {
    return { completed: true, completionRate: 100, threshold: phase.completion_threshold };
  }

  // Check completion of each goal
  let completedGoals = 0;
  for (const goal of goals) {
    const { completed } = await checkGoalCompletion(participantId, goal.id);
    if (completed) {
      completedGoals++;
    }
  }

  const completionRate = (completedGoals / goals.length) * 100;
  const threshold = phase.completion_threshold;

  return {
    completed: completionRate >= threshold,
    completionRate,
    threshold,
  };
}

/**
 * Advance participant to the next phase
 */
export async function advanceToNextPhase(
  participantId: string,
  challengeId: string,
  currentPhaseId: string
): Promise<ChallengePhase | null> {
  const supabase = createClient();

  // Get current phase order
  const { data: currentPhase } = await (supabase as any)
    .from("challenge_phases")
    .select("order_index")
    .eq("id", currentPhaseId)
    .single();

  if (!currentPhase) return null;

  // Find next phase
  const { data: nextPhase } = await (supabase as any)
    .from("challenge_phases")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("order_index", currentPhase.order_index + 1)
    .single();

  if (!nextPhase) {
    // No more phases, challenge might be complete
    return null;
  }

  // Mark current phase as completed
  await (supabase as any)
    .from("challenge_phases")
    .update({ status: "completed" })
    .eq("id", currentPhaseId);

  // Activate next phase
  await (supabase as any)
    .from("challenge_phases")
    .update({ status: "active" })
    .eq("id", nextPhase.id);

  // Update participant's current phase
  await supabase
    .from("challenge_participants")
    .update({ current_phase_id: nextPhase.id })
    .eq("id", participantId);

  // Create phase completion achievement
  await (supabase as any).from("participant_achievements").insert({
    participant_id: participantId,
    phase_id: currentPhaseId,
    achievement_type: "phase_complete",
    earned_at: new Date().toISOString(),
  });

  return nextPhase as ChallengePhase;
}

/**
 * Advance participant to the next goal within a phase
 */
export async function advanceToNextGoal(
  participantId: string,
  currentGoalId: string
): Promise<ChallengeGoal | null> {
  const supabase = createClient();

  // Get current goal details
  const { data: currentGoal } = await (supabase as any)
    .from("challenge_goals")
    .select("phase_id, challenge_id, order_index")
    .eq("id", currentGoalId)
    .single();

  if (!currentGoal) return null;

  // Create goal completion achievement
  await (supabase as any).from("participant_achievements").insert({
    participant_id: participantId,
    goal_id: currentGoalId,
    achievement_type: "goal_complete",
    earned_at: new Date().toISOString(),
  });

  // Find next goal in same phase (or challenge if no phase)
  const query = (supabase as any)
    .from("challenge_goals")
    .select("*")
    .eq("challenge_id", currentGoal.challenge_id)
    .eq("order_index", currentGoal.order_index + 1);

  if (currentGoal.phase_id) {
    query.eq("phase_id", currentGoal.phase_id);
  } else {
    query.is("phase_id", null);
  }

  const { data: nextGoal } = await query.single();

  if (nextGoal) {
    // Update participant's current goal
    await supabase
      .from("challenge_participants")
      .update({ current_goal_id: nextGoal.id })
      .eq("id", participantId);

    return nextGoal as ChallengeGoal;
  }

  // No more goals in this phase/challenge
  // Check if we need to advance to next phase
  if (currentGoal.phase_id) {
    const { completed } = await checkPhaseCompletion(participantId, currentGoal.phase_id);
    if (completed) {
      const nextPhase = await advanceToNextPhase(
        participantId,
        currentGoal.challenge_id,
        currentGoal.phase_id
      );

      if (nextPhase) {
        // Get first goal of next phase
        const { data: firstGoalOfNextPhase } = await (supabase as any)
          .from("challenge_goals")
          .select("*")
          .eq("phase_id", nextPhase.id)
          .order("order_index", { ascending: true })
          .limit(1)
          .single();

        if (firstGoalOfNextPhase) {
          await supabase
            .from("challenge_participants")
            .update({ current_goal_id: firstGoalOfNextPhase.id })
            .eq("id", participantId);

          return firstGoalOfNextPhase as ChallengeGoal;
        }
      }
    }
  }

  // Challenge complete!
  await markChallengeComplete(participantId);
  return null;
}

/**
 * Mark challenge as complete for participant
 */
async function markChallengeComplete(participantId: string): Promise<void> {
  const supabase = createClient();

  // Update participant
  await supabase
    .from("challenge_participants")
    .update({
      badge_earned: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", participantId);

  // Create challenge completion achievement
  await (supabase as any).from("participant_achievements").insert({
    participant_id: participantId,
    achievement_type: "challenge_complete",
    earned_at: new Date().toISOString(),
  });
}

/**
 * Initialize participant's starting position (first phase/goal)
 */
export async function initializeParticipantProgress(
  participantId: string,
  challengeId: string
): Promise<void> {
  const supabase = createClient();

  // Check if challenge has phases
  const { data: phases } = await (supabase as any)
    .from("challenge_phases")
    .select("id")
    .eq("challenge_id", challengeId)
    .order("order_index", { ascending: true })
    .limit(1);

  let firstPhaseId: string | null = null;
  let firstGoalId: string | null = null;

  if (phases && phases.length > 0) {
    // Has phases - activate first phase
    firstPhaseId = phases[0].id;
    await (supabase as any)
      .from("challenge_phases")
      .update({ status: "active" })
      .eq("id", firstPhaseId);

    // Get first goal of first phase
    const { data: goals } = await (supabase as any)
      .from("challenge_goals")
      .select("id")
      .eq("phase_id", firstPhaseId)
      .order("order_index", { ascending: true })
      .limit(1);

    if (goals && goals.length > 0) {
      firstGoalId = goals[0].id;
    }
  } else {
    // No phases - get first direct goal
    const { data: goals } = await (supabase as any)
      .from("challenge_goals")
      .select("id")
      .eq("challenge_id", challengeId)
      .is("phase_id", null)
      .order("order_index", { ascending: true })
      .limit(1);

    if (goals && goals.length > 0) {
      firstGoalId = goals[0].id;
    }
  }

  // Update participant with initial position
  await supabase
    .from("challenge_participants")
    .update({
      current_phase_id: firstPhaseId,
      current_goal_id: firstGoalId,
      streak_count: 0,
      best_streak: 0,
    })
    .eq("id", participantId);
}

/**
 * Get goal status for display
 */
export type GoalStatus = "locked" | "active" | "completed";

export async function getGoalStatus(
  participantId: string,
  goalId: string,
  currentGoalId: string | null
): Promise<GoalStatus> {
  if (goalId === currentGoalId) {
    return "active";
  }

  const { completed } = await checkGoalCompletion(participantId, goalId);
  if (completed) {
    return "completed";
  }

  return "locked";
}
