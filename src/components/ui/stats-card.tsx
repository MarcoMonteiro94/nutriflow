"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: "primary" | "blue" | "green" | "purple" | "amber";
  index?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const iconColorStyles = {
  primary: "bg-primary/15 text-primary",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  purple: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "primary",
  index = 0,
  trend,
}: StatsCardProps) {
  return (
    <motion.div
      className="bg-card text-card-foreground flex flex-col gap-4 rounded-2xl p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        y: -4,
        boxShadow:
          "0 8px 20px -4px oklch(0.3 0.02 30 / 0.12), 0 16px 40px -8px oklch(0.3 0.02 30 / 0.18)",
        transition: { duration: 0.2, ease: "easeOut" },
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            iconColorStyles[iconColor]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {trend && (
            <span
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
