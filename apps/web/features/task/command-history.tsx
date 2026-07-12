"use client";

import Link from "next/link";
import { Icon, Skeleton, Badge, ErrorState } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { useTasks } from "./hooks";
import { STATUS_META } from "./status";

/** Left rail: recent tasks history (Claude-style conversation list). Hidden < lg. */
export function CommandHistory() {
  const { data, isLoading, isError, error, refetch } = useTasks();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-card/40 lg:flex">
      <div className="flex h-12 items-center justify-between border-b border-line px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Gần đây</span>
        <Link href="/board" className="inline-flex items-center gap-1 text-xs text-b hover:underline">
          Bảng việc <Icon name="arrow-right" size={13} />
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
            <ErrorState message={error instanceof HttpError ? error.message : "Không tải được"} onRetry={refetch} />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted">Chưa có việc nào. Giao việc đầu tiên ở bên phải.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.slice(0, 8).map((t) => (
              <li key={t.id}>
                <Link
                  href="/board"
                  className="flex flex-col gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-line/50"
                >
                  <span className="line-clamp-1 text-sm text-ink">{t.title}</span>
                  <Badge tone={STATUS_META[t.status].tone}>{STATUS_META[t.status].label}</Badge>
                </Link>
              </li>
            ))}
            {data.length > 8 ? (
              <li className="px-3 py-2 text-center text-xs text-muted">Còn {data.length - 8} việc trong Luồng xử lý</li>
            ) : null}
          </ul>
        )}
      </div>
    </aside>
  );
}
