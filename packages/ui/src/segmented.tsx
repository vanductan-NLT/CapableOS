import type { ReactNode } from "react";
import { cn } from "./cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

/**
 * Segmented control (iOS/Linear-style tab switch). Used for the human/AI toggle
 * in the Pool form. Radio semantics via aria-pressed on the active segment.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("inline-flex w-full gap-1 rounded-lg border border-line bg-field p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-card text-brand-deep shadow-sm ring-1 ring-brand-line" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
