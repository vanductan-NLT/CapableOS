"use client";

import Link from "next/link";
import { Icon, Skeleton, Badge, ErrorState } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { HttpError } from "@/lib/http";
import { useTasks } from "./hooks";
import { STATUS_META, statusLabel } from "./status";

/** Left rail: recent tasks history (Claude-style conversation list). Hidden < lg. */
export function CommandHistory() {
  const t = useT();
  const { data, isLoading, isError, error, refetch } = useTasks();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-card/40 lg:flex">
      <div className="flex h-12 items-center justify-between border-b border-line px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t("Gần đây", "Recent")}</span>
        <Link href="/board" className="inline-flex items-center gap-1 text-xs text-b hover:underline">
          {t("Bảng việc", "Task board")} <Icon name="arrow-right" size={13} />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-1">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-1">
            <ErrorState message={error instanceof HttpError ? error.message : t("Không tải được", "Failed to load")} onRetry={refetch} />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted">{t("Chưa có việc nào. Giao việc đầu tiên ở bên phải.", "No tasks yet. Assign your first task on the right.")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.slice(0, 8).map((task) => (
              <li key={task.id}>
                <Link
                  href="/board"
                  className="flex flex-col gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-line/50"
                >
                  <span className="line-clamp-1 text-sm text-ink">{task.title}</span>
                  <Badge tone={STATUS_META[task.status].tone}>{statusLabel(task.status, t)}</Badge>
                </Link>
              </li>
            ))}
            {data.length > 8 ? (
              <li className="px-3 py-2 text-center text-xs text-muted">{t("Còn", "")} {data.length - 8} {t("việc trong Luồng xử lý", "more tasks in the processing flow")}</li>
            ) : null}
          </ul>
        )}
      </div>
    </aside>
  );
}
