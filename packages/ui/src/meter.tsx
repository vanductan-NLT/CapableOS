import { cn } from "./cn";

/**
 * Horizontal meter/progress bar. Fill animates via `transform: scaleX` (GPU, not
 * layout-thrashing `width`) and reveals from the left. `gradient` swaps the flat
 * fill for a brand gradient on emphasized meters.
 */
export function Meter({
  value,
  max = 100,
  color = "var(--brand)",
  gradient,
  className,
  trackClassName,
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  /** CSS background-image (e.g. var(--grad-b)) — overrides `color` when set. */
  gradient?: string;
  className?: string;
  trackClassName?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <span
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("block h-2 overflow-hidden rounded-full bg-line", trackClassName, className)}
    >
      <span
        className="block h-full w-full origin-left rounded-full transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${pct})`, background: gradient ?? color }}
      />
    </span>
  );
}
