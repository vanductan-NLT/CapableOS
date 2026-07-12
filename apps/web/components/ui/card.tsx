import { clsx } from "clsx";
import type { ReactNode } from "react";
import { EstimatedTag } from "./badge";

export function Card({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={clsx(
        "rounded-2xl border border-line bg-card p-4 shadow-[var(--elev-1)] md:p-5",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** KPI tile with a large tabular value, optional hint and ESTIMATED marker. */
export function StatTile({
  label,
  value,
  hint,
  estimated,
}: {
  label: string;
  value: string;
  hint?: string;
  estimated?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {estimated ? <EstimatedTag /> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
