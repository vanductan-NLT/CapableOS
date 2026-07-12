import { clsx } from "clsx";
import type { Tone } from "./verdict";

const FILL: Record<Tone, string> = {
  muted: "bg-muted",
  a: "bg-a",
  b: "bg-b",
  gold: "bg-gold",
  good: "bg-good",
  bad: "bg-bad",
};

/**
 * Horizontal meter for confidence / trust / match. `value` is 0..1.
 * Renders an accessible progressbar; the caption is the human-friendly band.
 */
export function Meter({
  value,
  label,
  caption,
  tone = "b",
  className,
}: {
  value: number;
  label?: string;
  caption?: string;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {(label || caption) && (
        <div className="flex items-center justify-between text-xs">
          {label ? <span className="text-muted">{label}</span> : <span />}
          {caption ? <span className="font-medium text-ink">{caption}</span> : null}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={clsx("h-full rounded-full transition-[width] duration-500", FILL[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
