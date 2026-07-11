import { clsx } from "clsx";
import type { ReactNode } from "react";

// Lightweight local UI kit for domain B. (Consolidate into packages/ui later — needs A approval.)

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("rounded-xl border border-line bg-card p-4 shadow-sm md:p-5", className)}>
      {children}
    </div>
  );
}

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "a" | "b" | "gold" | "good" | "bad";
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    muted: "bg-line/60 text-ink2",
    a: "bg-a-soft text-a",
    b: "bg-b-soft text-b",
    gold: "bg-gold-soft text-gold",
    good: "bg-[color:#E1F3EA] text-good",
    bad: "bg-[color:#F7E7E3] text-bad",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

/** ESTIMATED marker for un-validated cost/time (FR-14). */
export function EstimatedTag() {
  return <Badge tone="gold">estimated</Badge>;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-[color:#F0C7BE] bg-[color:#F7E7E3] px-4 py-4 text-sm text-bad">
      <p className="font-medium">Có lỗi xảy ra</p>
      <p className="mt-1 text-bad/90">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-2 rounded-md border border-bad/40 px-2.5 py-1 text-xs">
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-md bg-line/70", className)} aria-hidden />;
}
