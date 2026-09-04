"use client";

import { motion } from "framer-motion";
import { useScrollInView } from "./MotionSection";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface ScrollRevealContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ScrollRevealContainer({
  children,
  className,
}: ScrollRevealContainerProps) {
  const reducedMotion = useReducedMotion();
  const { ref, controls } = useScrollInView();

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
      initial={{ opacity: 0 }}
      animate={controls}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
