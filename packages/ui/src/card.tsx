import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/**
 * Surface primitive. Editorial-calm rule (research): commit to an EDGE *or* an
 * ELEVATION, never both on the same resting card — a hairline border + wide shadow
 * together is the #1 "generated-UI" tell. So:
 *   default      → flat 1px hairline, no shadow (the workhorse surface)
 *   elevated     → floating layered shadow, no border (the ONE hero card / screen)
 *   interactive  → hairline at rest, lifts to a soft shadow on hover (state, not decoration)
 */
export function Card({
  className,
  interactive,
  elevated,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; elevated?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-5 md:p-6",
        elevated ? "shadow-card-lg" : "border border-line",
        interactive && "transition-shadow duration-200 hover:border-transparent hover:shadow-card-lg focus-within:shadow-card-lg",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Small monospace over-line label used on cards ("KEY"). */
export function CardKicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted", className)}>
      {children}
    </span>
  );
}
