export const MOTION = {
  timing: {
    micro: {
      instant: 100,
      fast: 150,
      normal: 200,
    },
    ui: {
      fast: 200,
      normal: 300,
      slow: 450,
    },
    content: {
      fast: 400,
      normal: 600,
      slow: 800,
    },
    cinematic: {
      fast: 800,
      normal: 1200,
      slow: 1500,
    },
  },
  easing: {
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    easeOutExpo: "cubic-bezier(0.87, 0, 0.13, 1)",
    easeOutBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    gentle: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  distance: {
    none: 0,
    tiny: 8,
    small: 16,
    medium: 32,
    large: 48,
    xlarge: 64,
    xxlarge: 80,
  },
} as const;

export type MotionTiming = keyof typeof MOTION.timing;
export type MotionEasing = keyof typeof MOTION.easing;
export type MotionDistance = keyof typeof MOTION.distance;
