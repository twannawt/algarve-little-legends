/**
 * Gedeelde Framer Motion varianten — één plek voor de app-brede animatiestijl.
 */

export const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
} as const;

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
} as const;

export const popIn = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
} as const;
