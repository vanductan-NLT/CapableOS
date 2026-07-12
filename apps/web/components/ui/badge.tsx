"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import type { Tone } from "./verdict";

const TONE_MAP: Record<Tone, string> = {
  muted: "bg-blue-soft text-ink2",
  a: "bg-a-soft text-a",
  b: "bg-b-soft text-b",
  gold: "bg-gold-soft text-gold",
  good: "bg-[color:#DCFCE7] text-good dark:bg-good/15",
  bad: "bg-[color:#FEE4E2] text-bad dark:bg-bad/15",
};

export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        TONE_MAP[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** ESTIMATED marker for un-validated cost/time (FR-14). */
export function EstimatedTag() {
  const t = useT();
  return (
    <Badge tone="gold" className="uppercase tracking-wide">
      {t("ước tính", "estimated")}
    </Badge>
  );
}

/**
 * Capability shown as label + strength bar — never a raw "0.85" decimal.
 * `level` is 0..1.
 */
export function CapabilityChip({ name, level }: { name: string; level?: number }) {
  const pct = level != null ? Math.round(Math.max(0, Math.min(1, level)) * 100) : null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1 text-xs text-ink2"
      title={pct != null ? `${name} · ${pct}%` : name}
    >
      {name}
      {pct != null && (
        <span className="h-1.5 w-8 overflow-hidden rounded-full bg-line" aria-hidden>
          <span className="block h-full rounded-full bg-b" style={{ width: `${pct}%` }} />
        </span>
      )}
    </span>
  );
}
