export const easing = {
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  easeOutExpo: "cubic-bezier(0.87, 0, 0.13, 1)",
  easeOutBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  gentle: "cubic-bezier(0.22, 1, 0.36, 1)",
  linear: "linear",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}

export const presets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: easing.easeOutExpo },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: easing.easeOutExpo },
  },
  fadeInUpSmall: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: easing.easeOutExpo },
  },
  fadeInUpLarge: {
    initial: { opacity: 0, y: 80 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, ease: easing.easeOutExpo },
  },
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, ease: easing.easeOutExpo },
  },
  slideLeft: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.8, ease: easing.easeOutExpo },
  },
  slideRight: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.8, ease: easing.easeOutExpo },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: easing.easeOutBack },
  },
  heroReveal: {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.2, ease: easing.easeOutExpo },
  },
} as const;
