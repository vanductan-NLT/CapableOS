"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion";
import { cardHover, dur, ease, reveal, staggerContainer, staggerItem } from "./motion-tokens";
import { cn } from "./cn";

/**
 * Reveal — fade + small translateY on enter (in-view, once). Under reduced-motion
 * it keeps the fade and drops the movement. Enterprise recipe (Material 3 decelerate).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  ...rest
}: { children: ReactNode; className?: string; delay?: number } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : "hidden"}
      whileInView={reduce ? { opacity: 1 } : "show"}
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={reduce ? undefined : reveal}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — orchestrates child entrance. Pair with <StaggerItem>. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, margin: "-8% 0px" }}
      variants={reduce ? undefined : staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? undefined : staggerItem}>
      {children}
    </motion.div>
  );
}

/**
 * Lift — hover raise + press. Wrap interactive cards. Uses transform only (GPU).
 * The ~10% "bold" moment stays off dense text; keep for cards/tiles.
 */
export function Lift({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial="rest" whileHover="hover" whileTap="tap" variants={cardHover}>
      {children}
    </motion.div>
  );
}

/**
 * CountUp — animates a number to `value` when scrolled into view (once). Reduced
 * motion jumps straight to the final value. Cheap: writes the text node directly.
 */
export function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  duration = 1,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: ease.emphasizedDecelerate });
    return controls.stop;
  }, [inView, value, reduce, duration, mv]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {text}
    </motion.span>
  );
}

export { dur, ease, spring, reveal, staggerContainer, staggerItem, cardHover } from "./motion-tokens";
