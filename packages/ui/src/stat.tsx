import type { ReactNode } from "react";
import { cn } from "./cn";
import { Card } from "./card";
import { EstimatedTag } from "./badge";

/**
 * KPI tile — big tabular number with an icon chip, label, and optional hint.
 * `accent` tints the icon chip + a thin top rail to tie the tile to a metric
 * family (research: flat surface, colour lives in the rail/number, not the card).
 */
export function StatTile({
  label,
  value,
  hint,
  icon,
  accent = "brand",
  estimated,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: "brand" | "a" | "b" | "gold" | "good";
  estimated?: boolean;
  className?: string;
}) {
  const chip: Record<string, string> = {
    brand: "bg-brand-soft text-brand-deep",
    a: "bg-a-soft text-a",
    b: "bg-b-soft text-b-deep",
    gold: "bg-gold-soft text-gold",
    good: "bg-good-soft text-good",
  };
  const rail: Record<string, string> = {
    brand: "bg-grad-cta",
    a: "bg-grad-a",
    b: "bg-grad-b",
    gold: "bg-grad-gold",
    good: "bg-good",
  };
  return (
    <Card className={cn("relative flex flex-col gap-3 overflow-hidden", className)}>
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", rail[accent])} aria-hidden />
      <div className="flex items-center justify-between">
        {icon ? (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", chip[accent])}>{icon}</span>
        ) : (
          <span />
        )}
        {estimated ? <EstimatedTag /> : null}
      </div>
      <div>
        <p className="text-[34px] font-semibold leading-none tracking-tight tabular-nums text-ink md:text-[38px]">
          {value}
        </p>
        <p className="mt-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
        {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      </div>
    </Card>
  );
}
