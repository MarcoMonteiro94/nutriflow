"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Measurement, CustomMeasurementType, CustomMeasurementValue, MeasurementGoal } from "@/types/database";

interface MeasurementsChartProps {
  measurements: Measurement[];
  customTypes: CustomMeasurementType[];
  customValues: CustomMeasurementValue[];
  goals?: MeasurementGoal[];
}

type MetricConfig = { label: string; color: string; unit: string };

const STANDARD_METRIC_CONFIG: Record<string, MetricConfig> = {
  weight: { label: "Peso", color: "#2563eb", unit: "kg" },
  body_fat_percentage: { label: "% Gordura", color: "#dc2626", unit: "%" },
  muscle_mass: { label: "Massa Muscular", color: "#16a34a", unit: "kg" },
  waist_circumference: { label: "Cintura", color: "#9333ea", unit: "cm" },
};

// Color palette for custom metrics
const CUSTOM_METRIC_COLORS = [
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
];

export function MeasurementsChart({ measurements, customTypes, customValues, goals = [] }: MeasurementsChartProps) {
  // Build complete metric config including custom types
  const metricConfig = useMemo(() => {
    const config: Record<string, MetricConfig> = { ...STANDARD_METRIC_CONFIG };
    customTypes.forEach((type, index) => {
      config[`custom_${type.id}`] = {
        label: type.name,
        color: CUSTOM_METRIC_COLORS[index % CUSTOM_METRIC_COLORS.length],
        unit: type.unit,
      };
    });
    return config;
  }, [customTypes]);

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["weight", "body_fat_percentage"]);

  if (measurements.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Adicione medidas para visualizar a evolução.
      </div>
    );
  }

  const chartData = measurements.map((m) => {
    const dataPoint: Record<string, string | number | null> = {
      date: format(new Date(m.measured_at), "dd/MM", { locale: ptBR }),
      fullDate: format(new Date(m.measured_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      weight: m.weight ? Number(m.weight) : null,
      body_fat_percentage: m.body_fat_percentage ? Number(m.body_fat_percentage) : null,
      muscle_mass: m.muscle_mass ? Number(m.muscle_mass) : null,
      waist_circumference: m.waist_circumference ? Number(m.waist_circumference) : null,
    };

    // Add custom measurement values for this date
    const measurementCustomValues = customValues.filter(
      (v) => v.measured_at === m.measured_at
    );
    measurementCustomValues.forEach((customValue) => {
      dataPoint[`custom_${customValue.type_id}`] = Number(customValue.value);
    });

    return dataPoint;
  });

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.keys(metricConfig).map((key) => (
          <Button
            key={key}
            variant={selectedMetrics.includes(key) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMetric(key)}
            style={{
              backgroundColor: selectedMetrics.includes(key) ? metricConfig[key].color : undefined,
              borderColor: metricConfig[key].color,
              color: selectedMetrics.includes(key) ? "white" : metricConfig[key].color,
            }}
          >
            {metricConfig[key].label}
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
                      const config = metricConfig[entry.dataKey as string];
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
                const config = metricConfig[value as string];
                return config?.label || value;
              }}
            />
            {selectedMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={metricConfig[metric].color}
                strokeWidth={2}
                dot={{ fill: metricConfig[metric].color, strokeWidth: 0 }}
                connectNulls
              />
            ))}
            {goals.map((goal) => {
              const isSelected = selectedMetrics.includes(goal.metric_type);
              if (!isSelected) return null;
              const config = metricConfig[goal.metric_type];
              if (!config) return null;
              return (
                <ReferenceLine
                  key={`goal-${goal.id}`}
                  y={goal.target_value}
                  stroke={config.color}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  label={{
                    value: `Meta: ${goal.target_value} ${config.unit}`,
                    position: "right",
                    fill: config.color,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
