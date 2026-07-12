import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Standard padded, max-width wrapper for the non-chat surfaces
 * (Board, Workforce, Governance, Insights, My Work). The Command chat
 * console opts out and renders full-bleed.
 */
export function PageContainer({
  children,
  title,
  description,
  className,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full max-w-[1500px] px-4 py-8 md:px-8 md:py-10", className)}>
      {(title || description) && (
        <div className="mb-6">
          {title ? <h2 className="text-2xl font-bold tracking-[-0.01em] text-ink">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
      )}
      {children}
    </div>
  );
}
