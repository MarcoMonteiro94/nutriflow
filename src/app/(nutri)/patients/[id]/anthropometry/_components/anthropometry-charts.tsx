"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AnthropometryAssessment } from "@/types/database";

interface AnthropometryChartsProps {
  assessments: AnthropometryAssessment[];
}

type MetricKey =
  | "weight"
  | "body_fat_percentage"
  | "bmi"
  | "waist_circumference"
  | "hip_circumference"
  | "waist_hip_ratio";

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; unit: string }> = {
  weight: { label: "Peso", color: "#2563eb", unit: "kg" },
  body_fat_percentage: { label: "% Gordura", color: "#dc2626", unit: "%" },
  bmi: { label: "IMC", color: "#16a34a", unit: "kg/m²" },
  waist_circumference: { label: "Cintura", color: "#9333ea", unit: "cm" },
  hip_circumference: { label: "Quadril", color: "#ea580c", unit: "cm" },
  waist_hip_ratio: { label: "RCQ", color: "#0891b2", unit: "" },
};

export function AnthropometryCharts({ assessments }: AnthropometryChartsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["weight", "body_fat_percentage"]);

  if (assessments.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Adicione avaliações para visualizar a evolução.
      </div>
    );
  }

  const chartData = assessments.map((a) => ({
    date: format(new Date(a.assessed_at), "dd/MM", { locale: ptBR }),
    fullDate: format(new Date(a.assessed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    weight: a.weight ? Number(a.weight) : null,
    body_fat_percentage: a.body_fat_percentage ? Number(a.body_fat_percentage) : null,
    bmi: a.bmi ? Number(a.bmi) : null,
    waist_circumference: a.waist_circumference ? Number(a.waist_circumference) : null,
    hip_circumference: a.hip_circumference ? Number(a.hip_circumference) : null,
    waist_hip_ratio: a.waist_hip_ratio ? Number(a.waist_hip_ratio) : null,
  }));

  const toggleMetric = (metric: MetricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
          <Button
            key={key}
            variant={selectedMetrics.includes(key) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMetric(key)}
            style={{
              backgroundColor: selectedMetrics.includes(key) ? METRIC_CONFIG[key].color : undefined,
              borderColor: METRIC_CONFIG[key].color,
              color: selectedMetrics.includes(key) ? "white" : METRIC_CONFIG[key].color,
            }}
          >
            {METRIC_CONFIG[key].label}
          </Button>
        ))}
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="mb-2 font-medium">{data.fullDate}</p>
                    {payload.map((entry) => {
                      const config = METRIC_CONFIG[entry.dataKey as MetricKey];
                      if (!config || entry.value === null) return null;
                      return (
                        <p key={entry.dataKey} style={{ color: config.color }}>
                          {config.label}: {entry.value} {config.unit}
                        </p>
                      );
                    })}
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value) => {
                const config = METRIC_CONFIG[value as MetricKey];
                return config?.label || value;
              }}
            />
            {selectedMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={METRIC_CONFIG[metric].color}
                strokeWidth={2}
                dot={{ fill: METRIC_CONFIG[metric].color, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
