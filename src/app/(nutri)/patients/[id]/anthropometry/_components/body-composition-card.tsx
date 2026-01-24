import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingDown, TrendingUp, Scale, Percent, Ruler } from "lucide-react";
import type { AnthropometryAssessment } from "@/types/database";
import {
  getBMIClassification,
  getBodyFatClassification,
  getWHRClassification,
} from "@/lib/anthropometry-calculations";

interface BodyCompositionCardProps {
  latestAssessment: AnthropometryAssessment | null;
  previousAssessment?: AnthropometryAssessment | null;
  patientSex?: "male" | "female" | null;
}

interface MetricChange {
  value: number;
  trend: "up" | "down" | "stable";
}

function calculateChange(
  current: number | null | undefined,
  previous: number | null | undefined
): MetricChange | null {
  if (current == null || previous == null) return null;

  const change = current - previous;
  const trend = change > 0.01 ? "up" : change < -0.01 ? "down" : "stable";

  return { value: Math.abs(change), trend };
}

function TrendIndicator({
  change,
  lowerIsBetter = false,
  unit = "",
  prefix = "",
}: {
  change: MetricChange | null;
  lowerIsBetter?: boolean;
  unit?: string;
  prefix?: string;
}) {
  if (!change || change.trend === "stable") return null;

  const isPositive = lowerIsBetter
    ? change.trend === "down"
    : change.trend === "up";

  const colorClass = isPositive ? "text-green-600" : "text-red-600";
  const Icon = change.trend === "down" ? TrendingDown : TrendingUp;

  return (
    <p className={`text-xs ${colorClass}`}>
      <Icon className="inline h-3 w-3 mr-1" />
      {prefix}
      {change.value.toFixed(1)}
      {unit} desde última avaliação
    </p>
  );
}

export function BodyCompositionCard({
  latestAssessment,
  previousAssessment,
  patientSex,
}: BodyCompositionCardProps) {
  const bmiChange = calculateChange(
    latestAssessment?.bmi,
    previousAssessment?.bmi
  );
  const bodyFatChange = calculateChange(
    latestAssessment?.body_fat_percentage,
    previousAssessment?.body_fat_percentage
  );
  const whrChange = calculateChange(
    latestAssessment?.waist_hip_ratio,
    previousAssessment?.waist_hip_ratio
  );
  const weightChange = calculateChange(
    latestAssessment?.weight,
    previousAssessment?.weight
  );

  const bmiClassification = getBMIClassification(latestAssessment?.bmi);
  const bodyFatClassification = getBodyFatClassification(
    latestAssessment?.body_fat_percentage,
    patientSex
  );
  const whrClassification = getWHRClassification(
    latestAssessment?.waist_hip_ratio,
    patientSex
  );

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Weight Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Peso</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {latestAssessment?.weight != null
              ? `${latestAssessment.weight} kg`
              : "--"}
          </div>
          <TrendIndicator
            change={weightChange}
            lowerIsBetter={true}
            unit=" kg"
          />
        </CardContent>
      </Card>

      {/* BMI Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">IMC</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {latestAssessment?.bmi != null
              ? `${latestAssessment.bmi.toFixed(1)} kg/m²`
              : "--"}
          </div>
          {latestAssessment?.bmi != null && (
            <p className="text-xs text-muted-foreground">{bmiClassification}</p>
          )}
          <TrendIndicator
            change={bmiChange}
            lowerIsBetter={true}
            unit=" kg/m²"
          />
        </CardContent>
      </Card>

      {/* Body Fat Percentage Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">% Gordura</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {latestAssessment?.body_fat_percentage != null
              ? `${latestAssessment.body_fat_percentage.toFixed(1)}%`
              : "--"}
          </div>
          {latestAssessment?.body_fat_percentage != null && (
            <p className="text-xs text-muted-foreground">
              {bodyFatClassification}
            </p>
          )}
          <TrendIndicator
            change={bodyFatChange}
            lowerIsBetter={true}
            unit="%"
          />
        </CardContent>
      </Card>

      {/* Waist-Hip Ratio Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">RCQ</CardTitle>
          <Ruler className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {latestAssessment?.waist_hip_ratio != null
              ? latestAssessment.waist_hip_ratio.toFixed(2)
              : "--"}
          </div>
          {latestAssessment?.waist_hip_ratio != null && (
            <p className="text-xs text-muted-foreground">{whrClassification}</p>
          )}
          <TrendIndicator
            change={whrChange}
            lowerIsBetter={true}
            prefix=""
          />
        </CardContent>
      </Card>
    </div>
  );
}
