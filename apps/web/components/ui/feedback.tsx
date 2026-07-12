import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Icon } from "./icon";

export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-blue-soft/60 px-6 py-12 text-center">
      {icon ? <div className="mb-1 text-muted">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[color:#FEE4E2] bg-[color:#FFF7F6] px-4 py-4 text-sm text-bad shadow-[var(--elev-1)] dark:border-bad/30 dark:bg-bad/10"
    >
      <p className="flex items-center gap-1.5 font-medium">
        <Icon name="alert" size={16} />
        Có lỗi xảy ra
      </p>
      <p className="mt-1 text-bad/90">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-full border border-bad/40 px-3 py-1 text-xs font-semibold transition-colors hover:bg-bad/10"
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-2xl bg-blue-soft", className)} aria-hidden />;
}
