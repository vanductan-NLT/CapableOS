import type { ReactNode } from "react";
import { cn } from "./cn";
import { AlertIcon, InboxIcon } from "./icons";

/** Empty state — centered glyph + copy + optional action. */
export function EmptyState({
  title,
  hint,
  icon,
  action,
  className,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-line bg-grad-mesh px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grad-brand text-white shadow-glow-b">
        {icon ?? <InboxIcon size={22} />}
      </span>
      <p className="font-medium text-ink">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
      {action}
    </div>
  );
}

/** Error state — role=alert, retry affordance. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-bad/25 bg-bad-soft px-4 py-4 text-sm text-bad"
    >
      <AlertIcon size={20} className="mt-0.5 flex-none" />
      <div className="min-w-0">
        <p className="font-medium">Có lỗi xảy ra</p>
        <p className="mt-0.5 text-bad/90">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-lg border border-bad/40 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-bad/10"
          >
            Thử lại
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Shimmer placeholder. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line/70", className)} aria-hidden />;
}
