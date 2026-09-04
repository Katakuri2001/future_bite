"use client";

import { motion } from "framer-motion";
import { useScrollInView } from "./MotionSection";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export default function RevealText({
  children,
  className,
  delay = 0,
  duration = 0.8,
}: RevealTextProps) {
  const reducedMotion = useReducedMotion();
  const { ref, controls } = useScrollInView();

  if (reducedMotion) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={controls}
      transition={{ delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
