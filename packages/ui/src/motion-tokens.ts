import type { Transition, Variants } from "framer-motion";

// Motion tokens — Material 3 easing/duration ladder + low-bounce springs.
// Sources: m3.material.io/styles/motion, Apple HIG Motion, Linear-class micro timings.
// Kept in a non-"use client" module so both server and client code can read the values.

type Bezier = [number, number, number, number];

export const ease = {
  standard: [0.2, 0, 0, 1] as Bezier,
  standardDecelerate: [0, 0, 0, 1] as Bezier, // entering
  standardAccelerate: [0.3, 0, 1, 1] as Bezier, // exiting
  emphasized: [0.2, 0, 0, 1] as Bezier,
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1] as Bezier,
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15] as Bezier,
} as const;

/** Durations in seconds (framer). Dashboard motion stays in short + medium only. */
export const dur = {
  micro: 0.1, // hover/press tint
  fast: 0.15, // tab switch, small enter
  base: 0.2, // standard enter/exit
  reveal: 0.3, // section/page reveal
  emph: 0.4, // emphasized reveal / bar fill
} as const;

/** Springs (classic stiffness/damping form — supported across framer-motion 11.x). */
export const spring: Record<"press" | "pop" | "layout", Transition> = {
  press: { type: "spring", stiffness: 400, damping: 28, mass: 0.7 },
  pop: { type: "spring", stiffness: 300, damping: 20 },
  layout: { type: "spring", stiffness: 350, damping: 32, mass: 0.9 },
};

export const reveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: dur.reveal, ease: ease.standardDecelerate } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.standardDecelerate } },
};

/** Card hover/press — used with variants + whileHover/whileTap. */
export const cardHover: Variants = {
  rest: { y: 0 },
  hover: { y: -3, transition: { duration: dur.micro, ease: ease.standard } },
  tap: { scale: 0.985, transition: spring.press },
};
