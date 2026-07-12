"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";

/** Plain string (single language) or a { vi, en } pair resolved via useT(). */
type Localized = string | { vi: string; en: string };

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
  title?: Localized;
  description?: Localized;
  className?: string;
}) {
  const t = useT();
  const resolve = (v?: Localized) => (v == null ? undefined : typeof v === "string" ? v : t(v.vi, v.en));
  const titleText = resolve(title);
  const descriptionText = resolve(description);
  return (
    <div className={clsx("mx-auto w-full max-w-[1500px] px-4 py-8 md:px-8 md:py-10", className)}>
      {(titleText || descriptionText) && (
        <div className="mb-6">
          {titleText ? <h2 className="text-2xl font-bold tracking-[-0.01em] text-ink">{titleText}</h2> : null}
          {descriptionText ? <p className="mt-1 text-sm text-muted">{descriptionText}</p> : null}
        </div>
      )}
      {children}
    </div>
  );
}
