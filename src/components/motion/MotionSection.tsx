"use client";

import { useEffect } from "react";
import { useInView, motion, useAnimation, Variants } from "framer-motion";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { presets } from "@/lib/motion/easing";

export function useScrollInView(
  threshold: number = 0.15,
  once: boolean = true
) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: threshold, once });
  const controls = useAnimation();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      controls.start("show");
      return;
    }
    if (isInView) {
      controls.start("show");
    } else if (!once) {
      controls.start("hidden");
    }
  }, [isInView, controls, once, reducedMotion]);

  return { ref, controls, isInView };
}

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variants;
  as?: React.ElementType;
}

export function MotionSection({
  children,
  className,
  variant = presets.fadeInUp,
  as: Component = "section",
}: MotionSectionProps) {
  const reducedMotion = useReducedMotion();
  const { ref, controls } = useScrollInView();

  if (reducedMotion) {
    return (
      <Component className={className}>
        {children}
      </Component>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={variant}
      initial="hidden"
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  );
}
