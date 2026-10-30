"use client";

import { motion, useReducedMotion } from "motion/react";
import { popIn } from "@/registry/theme/manga-motion/manga-motion";

export default function MangaMotionDefaultDemo() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={popIn}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      className="ink-border ink-shadow inline-block bg-paper px-6 py-4 font-display text-2xl"
    >
      Dokan!
    </motion.div>
  );
}
