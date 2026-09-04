"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
      <div className={`relative ${className || ""}`}>
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 1.08 }}
      animate={controls}
      transition={{ delay, duration: 1, ease: "easeOut" }}
      className={`relative ${className || ""}`}
      style={{ overflow: "hidden" }}
    >
      <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" loading="lazy" />
    </motion.div>
  );
}
