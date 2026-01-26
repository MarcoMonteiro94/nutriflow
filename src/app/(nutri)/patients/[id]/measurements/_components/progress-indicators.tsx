import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Target, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import type { MeasurementGoal, Measurement } from "@/types/database";

interface ProgressIndicatorsProps {
  goals: MeasurementGoal[];
  latestMeasurement?: Measurement;
}

type MetricType = "weight" | "body_fat_percentage" | "muscle_mass" | "waist_circumference";

const metricConfig: Record<MetricType, { label: string; unit: string }> = {
  weight: { label: "Peso", unit: "kg" },
  body_fat_percentage: { label: "% Gordura", unit: "%" },
  muscle_mass: { label: "Massa Muscular", unit: "kg" },
  waist_circumference: { label: "Cintura", unit: "cm" },
};

function calculateProgress(currentValue: number | null, targetValue: number): {
  percentage: number;
  remaining: number;
  trend: "increasing" | "decreasing";
} {
  if (currentValue === null) {
    return { percentage: 0, remaining: Math.abs(targetValue), trend: targetValue > 0 ? "increasing" : "decreasing" };
  }

  const remaining = Math.abs(targetValue - currentValue);
  const trend = targetValue > currentValue ? "increasing" : "decreasing";

  // Calculate progress: if current value is at or past target, progress is 100%
  // Otherwise, calculate how much of the gap has been closed
  // Since we don't have initial value, we use a heuristic:
  // - Assume we want to show meaningful progress
  // - If we're within 10% of target, show 90%+ progress
  // - Otherwise scale based on how close we are

  let percentage = 0;
  if (remaining === 0) {
    percentage = 100;
  } else if (targetValue !== 0) {
    // Calculate proximity to target as percentage
    // The closer current is to target, the higher the percentage
    const proximityRatio = Math.abs(currentValue / targetValue);

    if (Math.abs(proximityRatio - 1) <= 0.1) {
      // Within 10% of target
      percentage = 90 + (10 * (1 - Math.abs(proximityRatio - 1) / 0.1));
    } else if (proximityRatio > 0.5 && proximityRatio < 1.5) {
      // Reasonable range - scale from 50% to 90%
      percentage = 50 + (40 * (1 - Math.abs(proximityRatio - 1) / 0.5));
    } else {
      // Far from target - show minimal progress
      percentage = Math.max(0, Math.min(50, 50 * proximityRatio));
    }
  }

  return {
    percentage: Math.max(0, Math.min(100, percentage)),
    remaining,
    trend,
  };
}

export function ProgressIndicators({ goals, latestMeasurement }: ProgressIndicatorsProps) {
  const activeGoals = goals.filter((goal) => goal.is_active);

  if (activeGoals.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {activeGoals.map((goal) => {
        const metricType = goal.metric_type as MetricType;
        const config = metricConfig[metricType];

        if (!config) return null;

        const currentValue = latestMeasurement?.[metricType as keyof Measurement] as number | null;
        const { percentage, remaining, trend } = calculateProgress(
          currentValue,
          goal.target_value
        );

        const targetDate = goal.target_date ? new Date(goal.target_date) : null;
        const isOverdue = targetDate && targetDate < new Date();

        return (
          <Card key={goal.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-2xl font-bold">
                    {currentValue !== null ? `${currentValue} ${config.unit}` : "--"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Meta: {goal.target_value} {config.unit}
                  </div>
                </div>
                <CircularProgress
                  value={percentage}
                  size="sm"
                  color={percentage >= 75 ? "green" : percentage >= 50 ? "blue" : "amber"}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Restante:</span>
                  <span className={`font-medium flex items-center gap-1 ${
                    currentValue !== null
                      ? trend === "increasing"
                        ? "text-blue-600"
                        : "text-green-600"
                      : ""
                  }`}>
                    {trend === "increasing" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {remaining.toFixed(1)} {config.unit}
                  </span>
                </div>

                {targetDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Prazo:
                    </span>
                    <span className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
                      {targetDate.toLocaleDateString("pt-BR")}
                      {isOverdue && " (vencido)"}
                    </span>
                  </div>
                )}

                {goal.notes && (
                  <p className="text-xs text-muted-foreground italic pt-1 line-clamp-2">
                    {goal.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
