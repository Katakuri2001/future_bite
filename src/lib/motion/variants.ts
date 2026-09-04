import type { Variants } from "framer-motion";

export const staggerContainer = (
  delay: number = 0.1,
  stagger: number = 0.08
): Variants => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: delay,
      staggerChildren: stagger,
      ease: "easeOut",
    },
  },
});

export const staggerItem = (
  delay: number = 0,
  variants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  }
): Variants => ({
  hidden: { ...variants.hidden, transition: { delay } },
  show: { ...variants.show, transition: { duration: 0.6, ease: "easeOut" } },
});

export const textReveal = (
  delay: number = 0,
  duration: number = 0.8
): Variants => ({
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay, duration, ease: "easeOut" },
  },
});

export const imageReveal = (
  delay: number = 0
): Variants => ({
  hidden: { opacity: 0, scale: 1.08 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { delay, duration: 1, ease: "easeOut" },
  },
});

export const parallaxItem = (
  distance: number = 30
): Variants => ({
  hidden: { opacity: 0, y: distance },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: "easeOut" },
  },
});

export const cardHover = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const buttonHover = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1, ease: "easeIn" },
  },
};

export const navVariants = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.4, ease: "easeIn" } },
};

export const slideVariants = {
  enterRight: {
    opacity: 0,
    x: "100%",
    transition: { duration: 0.5, ease: "easeOut" },
  },
  enterCenter: {
    opacity: 0,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  enterLeft: {
    opacity: 0,
    x: "-100%",
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exitLeft: {
    opacity: 0,
    x: "-100%",
    transition: { duration: 0.4, ease: "easeIn" },
  },
  exitRight: {
    opacity: 0,
    x: "100%",
    transition: { duration: 0.4, ease: "easeIn" },
  },
};
