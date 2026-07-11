import type { ReactNode } from "react";
import { cn } from "./cn";
import { SparkIcon } from "./icons";

export type Tone = "muted" | "a" | "b" | "gold" | "good" | "bad";

const TONE: Record<Tone, string> = {
  muted: "bg-line/70 text-ink2 ring-line",
  a: "bg-a-soft text-a ring-a-line",
  b: "bg-b-soft text-b-deep ring-b-line",
  gold: "bg-gold-soft text-gold ring-gold-line",
  good: "bg-good-soft text-good ring-good/25",
  bad: "bg-bad-soft text-bad ring-bad/25",
};

/**
 * Status pill. `dot` shows a leading status dot; `icon` slots a leading SVG.
 * Uppercase mono keeps it in the Playbook's label voice.
 */
export function Badge({
  tone = "muted",
  dot,
  icon,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {icon}
      {children}
    </span>
  );
}

/** ESTIMATED marker for un-validated cost/time (FR-14). */
export function EstimatedTag() {
  return (
    <Badge tone="gold" icon={<SparkIcon size={11} />}>
      estimated
    </Badge>
  );
}
