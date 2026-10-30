import type { Transition, Variants } from "motion/react";

/** Spring presets. `slam` lands hard with almost no bounce; `pop` overshoots like a reveal. */
export const springs = {
  slam: { type: "spring", stiffness: 700, damping: 28, mass: 0.8 },
  pop: { type: "spring", stiffness: 500, damping: 18 },
  settle: { type: "spring", stiffness: 300, damping: 30 },
} as const satisfies Record<string, Transition>;

/** Cubic-bezier curves, matching the `animate-mangacn-*` utilities in the theme item. */
export const easings = {
  impact: [0.2, 0.8, 0.2, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
  snap: [0.7, 0, 0.3, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Scale up from 60 % with an overshoot. Labels: `hidden` → `visible`. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: springs.pop },
};

/** Drop in from 140 % and land hard. Labels: `hidden` → `visible`. */
export const slamIn: Variants = {
  hidden: { opacity: 0, scale: 1.4 },
  visible: { opacity: 1, scale: 1, transition: springs.slam },
};

/** Three ±4 px horizontal jolts. Labels: `idle` → `active`. */
export const shake: Variants = {
  idle: { x: 0 },
  active: { x: [0, -4, 4, -4, 4, -4, 4, 0], transition: { duration: 0.36, ease: easings.snap } },
};

/** Dip to 20 % opacity and back, like a panel flash. Labels: `idle` → `active`. */
export const flash: Variants = {
  idle: { opacity: 1 },
  active: { opacity: [1, 0.2, 1], transition: { duration: 0.4, ease: easings.impact } },
};
