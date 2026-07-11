import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/**
 * Surface primitive. `interactive` adds the hover lift used on clickable cards
 * (Linear/Stripe pattern: 1px border + soft shadow, elevate on hover).
 */
export function Card({
  className,
  interactive,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card shadow-card",
        interactive && "transition-shadow duration-200 hover:shadow-card-lg focus-within:shadow-card-lg",
        "p-4 md:p-5",
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
    <span className={cn("font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted", className)}>
      {children}
    </span>
  );
}
