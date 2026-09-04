"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export default function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
}: FadeInProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
