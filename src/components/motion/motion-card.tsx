"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ children, className, interactive = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-2xl py-6 shadow-soft",
          className
        )}
        whileHover={
          interactive
            ? {
                y: -4,
                boxShadow:
                  "0 8px 20px -4px oklch(0.3 0.02 30 / 0.12), 0 16px 40px -8px oklch(0.3 0.02 30 / 0.18)",
                transition: { duration: 0.2, ease: "easeOut" },
              }
            : undefined
        }
        whileTap={
          interactive
            ? {
                scale: 0.98,
                transition: { duration: 0.1 },
              }
            : undefined
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MotionCard.displayName = "MotionCard";

// Stats card variant with number counting animation support
interface MotionStatsCardProps extends MotionCardProps {
  index?: number;
}

export const MotionStatsCard = forwardRef<HTMLDivElement, MotionStatsCardProps>(
  ({ children, className, index = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-2xl py-6 shadow-soft",
          className
        )}
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
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MotionStatsCard.displayName = "MotionStatsCard";
