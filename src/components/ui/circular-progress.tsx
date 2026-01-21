"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  strokeWidth?: number;
  color?: "primary" | "blue" | "green" | "purple" | "amber";
  showValue?: boolean;
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: { dimension: 48, fontSize: "text-xs" },
  md: { dimension: 72, fontSize: "text-sm" },
  lg: { dimension: 96, fontSize: "text-base" },
};

const colorStyles = {
  primary: "stroke-primary",
  blue: "stroke-blue-500",
  green: "stroke-emerald-500",
  purple: "stroke-purple-500",
  amber: "stroke-amber-500",
};

export function CircularProgress({
  value,
  max = 100,
  size = "md",
  strokeWidth = 6,
  color = "primary",
  showValue = true,
  label,
  className,
}: CircularProgressProps) {
  const { dimension, fontSize } = sizeStyles[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference - percentage * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="rotate-[-90deg]"
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(colorStyles[color])}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 1,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", fontSize)}>
            {Math.round(percentage * 100)}%
          </span>
          {label && (
            <span className="text-[10px] text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
