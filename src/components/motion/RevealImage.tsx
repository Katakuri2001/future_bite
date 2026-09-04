"use client";

import { motion } from "framer-motion";
import { useScrollInView } from "./MotionSection";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface RevealImageProps {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
}

export default function RevealImage({
  src,
  alt,
  className,
  delay = 0,
}: RevealImageProps) {
  const reducedMotion = useReducedMotion();
  const { ref, controls } = useScrollInView();

  if (reducedMotion) {
    return (
      <div className={className}>
        <img src={src} alt={alt} loading="lazy" />
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 1.08 }}
      animate={controls}
      transition={{ delay, duration: 1, ease: "easeOut" }}
      className={className}
      style={{ overflow: "hidden" }}
    >
      <img src={src} alt={alt} loading="lazy" />
    </motion.div>
  );
}
