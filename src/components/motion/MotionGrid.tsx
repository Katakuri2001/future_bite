"use client";

import { useRef } from "react";
import { motion, useAnimation, Variants } from "framer-motion";
import { useScrollInView } from "./MotionSection";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { staggerContainer as baseStagger } from "@/lib/motion/variants";

interface MotionGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
}

export default function MotionGrid({
  children,
  className,
  columns = 3,
}: MotionGridProps) {
  const reducedMotion = useReducedMotion();
  const { ref, controls } = useScrollInView();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.12,
      },
    },
  };

  if (reducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "1.5rem",
      }}
    >
      {children}
    </motion.div>
  );
}
