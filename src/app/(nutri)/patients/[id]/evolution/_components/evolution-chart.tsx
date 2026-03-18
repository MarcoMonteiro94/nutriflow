"use client";

import { useMemo, useState } from "react";
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

export interface UnifiedDataPoint {
  date: string;
  weight?: number | null;
  bmi?: number | null;
  body_fat?: number | null;
  muscle_mass?: number | null;
  waist?: number | null;
  hip?: number | null;
  source: "measurement" | "anthropometry";
}

interface EvolutionChartProps {
  data: UnifiedDataPoint[];
}

const METRICS = [
  { key: "weight", label: "Peso (kg)", color: "#2563eb" },
  { key: "bmi", label: "IMC", color: "#8b5cf6" },
  { key: "body_fat", label: "% Gordura", color: "#f59e0b" },
  { key: "muscle_mass", label: "Massa Muscular (kg)", color: "#10b981" },
  { key: "waist", label: "Cintura (cm)", color: "#ef4444" },
] as const;

export function EvolutionChart({ data }: EvolutionChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(["weight", "body_fat"])
  );

  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      dateFormatted: format(new Date(point.date), "dd/MM/yy", { locale: ptBR }),
    }));
  }, [data]);

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhum dado disponível para o gráfico.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {METRICS.map((metric) => (
          <Button
            key={metric.key}
            variant={activeMetrics.has(metric.key) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMetric(metric.key)}
            className="text-xs"
            style={
              activeMetrics.has(metric.key)
                ? { backgroundColor: metric.color, borderColor: metric.color }
                : undefined
            }
          >
            {metric.label}
          </Button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            }}
          />
          <Legend />
          {METRICS.filter((m) => activeMetrics.has(m.key)).map((metric) => (
            <Line
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              name={metric.label}
              stroke={metric.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
