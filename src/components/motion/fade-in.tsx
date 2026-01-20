"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { forwardRef } from "react";

type Direction = "up" | "down" | "left" | "right";

const getDirectionOffset = (direction: Direction) => {
  switch (direction) {
    case "up":
      return { y: 20, x: 0 };
    case "down":
      return { y: -20, x: 0 };
    case "left":
      return { y: 0, x: 20 };
    case "right":
      return { y: 0, x: -20 };
  }
};

const createFadeVariants = (direction: Direction, distance = 20): Variants => {
  const offset = getDirectionOffset(direction);
  const scaledOffset = {
    y: (offset.y / 20) * distance,
    x: (offset.x / 20) * distance,
  };

  return {
    hidden: {
      opacity: 0,
      ...scaledOffset,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };
};

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  distance?: number;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, className, direction = "up", delay = 0, distance = 20, ...props }, ref) => {
    const variants = createFadeVariants(direction, distance);

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={{ delay }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FadeIn.displayName = "FadeIn";
